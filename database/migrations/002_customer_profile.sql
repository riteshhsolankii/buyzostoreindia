-- Customer profile extras: avatar (small data URL) and the address book.
-- The address book is stored as a JSON array so it can grow without a join table.
ALTER TABLE customers ADD COLUMN avatar TEXT;
ALTER TABLE customers ADD COLUMN addresses_json TEXT
  CHECK(addresses_json IS NULL OR json_valid(addresses_json));
