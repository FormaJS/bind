import { describe, it, expect } from "vitest";
import { forma } from "@formajs/mold";
import { rhfBinder } from "../src/rhf.js";

describe("rhfBinder", () => {
  it("retorna values sanitizados quando válido", async () => {
    const schema = forma.object({
      name: forma.string().trim().validateLength({ min: 3 }),
    });
    const resolver = rhfBinder(schema);
    const result = await resolver({ name: "  Ana  " });
    expect(result.errors).toEqual({});
    expect(result.values.name).toBe("Ana");
  });

  it("achata erros simples", async () => {
    const schema = forma.object({
      name: forma.string().validateLength({ min: 3 }),
    });
    const resolver = rhfBinder(schema);
    const result = await resolver({ name: "ab" });
    expect(result.values).toEqual({});
    // mold expõe regra específica: validateLengthMin
    expect(result.errors.name.type).toBe("validateLengthMin");
    expect(result.errors.name.message).toBeTruthy();
  });

  it("achata erros aninhados e de array", async () => {
    const tagSchema = forma.string().validateNotEmpty();
    const schema = forma.object({
      user: forma.object({
        profile: forma.object({
          email: forma.string().validateEmail(),
        }),
      }),
      tags: forma.array(tagSchema),
    });
    const resolver = rhfBinder(schema);
    const result = await resolver({
      user: { profile: { email: "invalid" } },
      tags: ["ok", ""],
    });
    // user.profile.email
    expect(result.errors["user.profile.email"]).toBeDefined();
    // tags.1 (segundo índice)
    expect(result.errors["tags.1"]).toBeDefined();
  });

  it("throws error for invalid schema", () => {
    expect(() => rhfBinder(null)).toThrow("rhfBinder requires a mold schema");
    expect(() => rhfBinder({})).toThrow("rhfBinder requires a mold schema");
    expect(() => rhfBinder({ validate: "not a function" })).toThrow(
      "rhfBinder requires a mold schema",
    );
  });

  it("handles empty object input", async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty(),
    });
    const resolver = rhfBinder(schema);
    const result = await resolver({});
    expect(result.errors.name).toBeDefined();
    expect(result.values).toEqual({});
  });

  it("handles null/undefined input", async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty(),
    });
    const resolver = rhfBinder(schema);
    const result1 = await resolver(null);
    const result2 = await resolver(undefined);

    // Mold v2 produces errors for null/undefined inputs
    expect(result1.errors).toBeDefined();
    expect(result2.errors).toBeDefined();
  });

  it("preserves valid values when some fields are invalid", async () => {
    const schema = forma.object({
      name: forma.string().validateLength({ min: 3 }),
      email: forma.string().validateEmail(),
      age: forma.number().min(18),
    });
    const resolver = rhfBinder(schema);
    const result = await resolver({
      name: "John",
      email: "invalid-email",
      age: 25,
    });

    expect(result.values).toEqual({});
    expect(result.errors.name).toBeUndefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.age).toBeUndefined();
  });

  it("handles complex array of objects", async () => {
    const userSchema = forma.object({
      name: forma.string().validateNotEmpty(),
      email: forma.string().validateEmail(),
    });

    const schema = forma.object({
      users: forma.array(userSchema),
    });

    const resolver = rhfBinder(schema);
    const result = await resolver({
      users: [
        { name: "John", email: "john@example.com" },
        { name: "", email: "invalid-email" },
        { name: "Jane", email: "jane@example.com" },
      ],
    });

    expect(result.values).toEqual({});
    expect(result.errors["users.1.name"]).toBeDefined();
    expect(result.errors["users.1.email"]).toBeDefined();
    expect(result.errors["users.0.name"]).toBeUndefined();
    expect(result.errors["users.0.email"]).toBeUndefined();
  });

  it("handles deeply nested structures", async () => {
    const schema = forma.object({
      company: forma.object({
        departments: forma.array(
          forma.object({
            manager: forma.object({
              name: forma.string().validateNotEmpty(),
              contact: forma.object({
                email: forma.string().validateEmail(),
              }),
            }),
          }),
        ),
      }),
    });

    const resolver = rhfBinder(schema);
    const result = await resolver({
      company: {
        departments: [
          {
            manager: {
              name: "John",
              contact: { email: "invalid" },
            },
          },
        ],
      },
    });

    expect(result.values).toEqual({});
    expect(
      result.errors["company.departments.0.manager.contact.email"],
    ).toBeDefined();
    expect(result.errors["company.departments.0.manager.name"]).toBeUndefined();
  });

  it("handles multiple validation errors per field", async () => {
    const schema = forma.object({
      password: forma
        .string()
        .validateLength({ min: 8 })
        .validateContains({ seed: "special" }),
    });

    const resolver = rhfBinder(schema);
    const result = await resolver({
      password: "short",
    });

    expect(result.values).toEqual({});
    // Should contain at least one error for password
    expect(result.errors.password).toBeDefined();
    expect(result.errors.password.type).toBeTruthy();
    expect(result.errors.password.message).toBeTruthy();
  });

  it("handles schema with formatters", async () => {
    const schema = forma.object({
      name: forma.string().trim(),
    });

    const resolver = rhfBinder(schema);
    const result = await resolver({
      name: "  JOHN DOE  ",
    });

    expect(result.errors).toEqual({});
    expect(result.values.name).toBe("JOHN DOE");
  });
});
