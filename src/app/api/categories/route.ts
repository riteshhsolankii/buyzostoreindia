import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import {
  addCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "@/lib/categories";

async function isAdmin(request: NextRequest): Promise<boolean> {
  return isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
}

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listCategories(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
  } | null;
  const result = await addCategory(body?.name ?? "");
  if (result === "invalid") {
    return NextResponse.json(
      { error: "Category name is required." },
      { status: 400 }
    );
  }
  if (result === "exists") {
    return NextResponse.json(
      { error: "This category already exists." },
      { status: 409 }
    );
  }
  return NextResponse.json(await listCategories(), { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    from?: string;
    to?: string;
  } | null;
  const result = await renameCategory(body?.from ?? "", body?.to ?? "");
  if (result === "invalid") {
    return NextResponse.json(
      { error: "New category name is required." },
      { status: 400 }
    );
  }
  if (result === "not-found") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
  if (result === "exists") {
    return NextResponse.json(
      { error: "A category with that name already exists." },
      { status: 409 }
    );
  }
  return NextResponse.json(await listCategories());
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
  } | null;
  const result = await deleteCategory(body?.name ?? "");
  if (result === "not-found") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
  if (result === "in-use") {
    return NextResponse.json(
      { error: "This category has products in it. Move or delete them first." },
      { status: 409 }
    );
  }
  return NextResponse.json(await listCategories());
}
