import { describe, it, expect } from "vitest";
import { forma } from "@formajs/mold";
import { tanstackBinder } from "../src/tanstack.js";

describe("tanstackBinder", () => {
  it("retorna {} quando válido", async () => {
    const schema = forma.object({
      name: forma.string().validateLength({ min: 3 }),
    });
    const validate = tanstackBinder(schema);
    const errors = await validate({ name: "Abc" });
    expect(errors).toEqual({});
  });

  it("retorna mensagens achatadas", async () => {
    const schema = forma.object({
      user: forma.object({ email: forma.string().validateEmail() }),
    });
    const validate = tanstackBinder(schema);
    const errors = await validate({ user: { email: "invalid" } });
    expect(typeof errors["user.email"]).toBe("string");
  });

  it("handles simple field errors", async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty(),
      age: forma.number().min(18),
    });
    const validate = tanstackBinder(schema);
    const errors = await validate({ name: "", age: 15 });

    expect(typeof errors.name).toBe("string");
    expect(typeof errors.age).toBe("string");
  });

  it("handles deeply nested structures", async () => {
    const schema = forma.object({
      company: forma.object({
        departments: forma.array(
          forma.object({
            manager: forma.object({
              contact: forma.object({
                email: forma.string().validateEmail(),
              }),
            }),
          }),
        ),
      }),
    });

    const validate = tanstackBinder(schema);
    const errors = await validate({
      company: {
        departments: [
          {
            manager: {
              contact: { email: "invalid" },
            },
          },
        ],
      },
    });

    expect(typeof errors["company.departments.0.manager.contact.email"]).toBe(
      "string",
    );
  });

  it("handles array errors", async () => {
    const schema = forma.object({
      tags: forma.array(forma.string().validateNotEmpty()),
    });
    const validate = tanstackBinder(schema);
    const errors = await validate({
      tags: ["valid", "", "another"],
    });

    expect(typeof errors["tags.1"]).toBe("string");
    expect(errors["tags.0"]).toBeUndefined();
  });

  it("handles complex array of objects", async () => {
    const itemSchema = forma.object({
      name: forma.string().validateNotEmpty(),
      quantity: forma.number().min(1),
    });

    const schema = forma.object({
      items: forma.array(itemSchema),
    });

    const validate = tanstackBinder(schema);
    const errors = await validate({
      items: [
        { name: "Item 1", quantity: 2 },
        { name: "", quantity: 0 },
      ],
    });

    expect(typeof errors["items.1.name"]).toBe("string");
    expect(typeof errors["items.1.quantity"]).toBe("string");
  });

  it("handles empty input", async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty(),
    });
    const validate = tanstackBinder(schema);
    const errors = await validate({});

    expect(typeof errors.name).toBe("string");
  });

  it("handles null/undefined input", async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty(),
    });
    const validate = tanstackBinder(schema);
    const errors1 = await validate(null);
    const errors2 = await validate(undefined);

    // Mold v2 produces errors for null/undefined inputs
    expect(typeof errors1).toBe("object");
    expect(typeof errors2).toBe("object");
  });

  it("returns first error message from multiple validations", async () => {
    const schema = forma.object({
      field: forma
        .string()
        .validateLength({ min: 5 })
        .validateMatches({ pattern: /^[A-Z]/ }),
    });

    const validate = tanstackBinder(schema);
    const errors = await validate({ field: "abc" });

    expect(typeof errors.field).toBe("string");
    expect(errors.field.length).toBeGreaterThan(0);
  });
});
