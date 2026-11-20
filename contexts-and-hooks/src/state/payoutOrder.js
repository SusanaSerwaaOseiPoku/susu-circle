export function getPayoutOrder(members) {
  if (!Array.isArray(members)) return [];

  return members.map((member, index) => {
    const name = typeof member?.name === "string" ? member.name.trim() : "";
    const id = member?.id;
    const hasId =
      typeof id === "number" || (typeof id === "string" && id.trim() !== "");

    return {
      id: hasId ? id : `member-${index + 1}`,
      name: name || "Unnamed member",
      position: index + 1,
    };
  });
}
