type UUID = string & { __brand: "UUID" };

function isValidUUID(id: string): id is UUID {
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id);
}

export function assertUUID(id: string): UUID {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID string: ${id}`);
  }
  return id;
}