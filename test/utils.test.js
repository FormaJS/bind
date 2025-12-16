import { describe, it, expect } from "vitest";
import {
  flattenMoldErrorsToRHF,
  transformMoldErrorsToFormik,
  ValidationError,
} from "../src/utils.js";

describe("flattenMoldErrorsToRHF", () => {
  it("returns empty object for null/undefined input", () => {
    expect(flattenMoldErrorsToRHF(null)).toEqual({});
    expect(flattenMoldErrorsToRHF(undefined)).toEqual({});
  });

  it("handles simple field errors", () => {
    const errors = {
      name: [{ rule: "validateLengthMin", message: "Too short" }],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      name: { type: "validateLengthMin", message: "Too short" },
    });
  });

  it("handles nested object errors", () => {
    const errors = {
      user: {
        profile: {
          email: [{ rule: "validateEmailFormat", message: "Invalid email" }],
        },
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "user.profile.email": {
        type: "validateEmailFormat",
        message: "Invalid email",
      },
    });
  });

  it("handles array errors with items property", () => {
    const errors = {
      tags: {
        items: {
          1: [{ rule: "isEmpty", message: "Cannot be empty" }],
          3: [{ rule: "isEmpty", message: "Cannot be empty" }],
        },
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "tags.items.1": { type: "isEmpty", message: "Cannot be empty" },
      "tags.items.3": { type: "isEmpty", message: "Cannot be empty" },
    });
  });

  it("handles array of objects with nested errors", () => {
    const errors = {
      users: {
        items: {
          0: {
            name: [{ rule: "validateLengthMin", message: "Name too short" }],
          },
          2: {
            email: [{ rule: "validateEmailFormat", message: "Invalid email" }],
          },
        },
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "users.items.0.name": {
        type: "validateLengthMin",
        message: "Name too short",
      },
      "users.items.2.email": {
        type: "validateEmailFormat",
        message: "Invalid email",
      },
    });
  });

  it("handles mixed array structure with direct errors and items", () => {
    const errors = {
      tags: [
        { rule: "validateLengthMax", message: "Too many tags" },
        { rule: "validateLengthMax", message: "Another error" },
        {
          items: {
            1: [{ rule: "isEmpty", message: "Tag cannot be empty" }],
          },
        },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      tags: { type: "validateLengthMax", message: "Too many tags" },
    });
  });

  it("handles empty arrays with items", () => {
    const errors = {
      tags: {
        items: {
          0: [{ rule: "isEmpty", message: "Empty tag" }],
        },
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "tags.items.0": { type: "isEmpty", message: "Empty tag" },
    });
  });

  it("handles ObjectSchema wrapper in arrays", () => {
    const errors = {
      users: {
        items: {
          0: [
            {
              name: [{ rule: "validateLengthMin", message: "Name required" }],
            },
          ],
        },
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "users.items.0.name": {
        type: "validateLengthMin",
        message: "Name required",
      },
    });
  });

  it("ignores non-error objects in arrays", () => {
    const errors = {
      data: [
        { someData: "value" },
        { rule: "validateRequired", message: "Required" },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "data.1": { type: "validateRequired", message: "Required" },
    });
  });
});

describe("transformMoldErrorsToFormik", () => {
  it("returns empty object for null/undefined input", () => {
    expect(transformMoldErrorsToFormik(null)).toEqual({});
    expect(transformMoldErrorsToFormik(undefined)).toEqual({});
  });

  it("converts simple field errors to strings", () => {
    const errors = {
      name: [{ rule: "validateLengthMin", message: "Too short" }],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      name: "Too short",
    });
  });

  it("preserves nested object structure", () => {
    const errors = {
      user: {
        profile: {
          email: [{ rule: "validateEmailFormat", message: "Invalid email" }],
        },
      },
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      user: {
        profile: {
          email: "Invalid email",
        },
      },
    });
  });

  it("handles array items as indexed objects", () => {
    const errors = {
      tags: {
        items: {
          1: [{ rule: "isEmpty", message: "Cannot be empty" }],
          3: [{ rule: "isEmpty", message: "Cannot be empty" }],
        },
      },
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      tags: {
        items: {
          1: "Cannot be empty",
          3: "Cannot be empty",
        },
      },
    });
  });

  it("handles ObjectSchema wrapper in arrays", () => {
    const errors = {
      users: {
        items: {
          0: [
            {
              name: [{ rule: "validateLengthMin", message: "Name required" }],
            },
          ],
        },
      },
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      users: {
        items: {
          0: {
            name: "Name required",
          },
        },
      },
    });
  });

  it("handles mixed array structure", () => {
    const errors = {
      tags: [
        { rule: "validateLengthMax", message: "Too many tags" },
        {
          items: {
            1: [{ rule: "isEmpty", message: "Tag cannot be empty" }],
          },
        },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      tags: "Too many tags",
    });
  });

  it("returns first error message from array of errors", () => {
    const errors = {
      field: [
        { rule: "validateLengthMin", message: "Too short" },
        { rule: "validatePattern", message: "Invalid pattern" },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: "Too short",
    });
  });

  it("ignores empty arrays without items", () => {
    const errors = {
      tags: [],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({});
  });

  it("handles empty array with items property in flattenMoldErrorsToRHF", () => {
    const errors = {
      tags: {
        length: 0,
        items: {},
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({});
  });

  it("handles array with mixed error objects and nested objects", () => {
    const errors = {
      data: [
        { rule: "validateRequired", message: "Required" },
        { someField: [{ rule: "validateLengthMin", message: "Too short" }] },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      data: { type: "validateRequired", message: "Required" },
    });
  });

  it("handles empty array with items in transformMoldErrorsToFormik", () => {
    const errors = {
      tags: {
        length: 0,
        items: {
          0: [{ rule: "isEmpty", message: "Empty" }],
        },
      },
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      tags: {
        items: {
          0: "Empty",
        },
      },
    });
  });

  it("handles array with only base messages in transformMoldErrorsToFormik", () => {
    const errors = {
      field: [
        { rule: "rule1", message: "Message 1" },
        { rule: "rule2", message: "Message 2" },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: "Message 1",
    });
  });

  it("handles empty array in walk function", () => {
    const errors = {
      emptyArray: [],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({});
  });

  it("handles array with nested objects in loop", () => {
    const errors = {
      items: [
        { rule: "validateRequired", message: "Required" },
        {
          nested: {
            field: [{ rule: "validateLengthMin", message: "Too short" }],
          },
        },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      items: { type: "validateRequired", message: "Required" },
    });
  });

  it("handles empty array in convert function", () => {
    const errors = {
      emptyField: [],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({});
  });

  it("handles array with object wrapper in convert function", () => {
    const errors = {
      field: [
        {
          nested: [{ rule: "validateRequired", message: "Required" }],
        },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: {
        nested: "Required",
      },
    });
  });

  it("covers array loop with non-error objects in walk function", () => {
    const errors = {
      list: [
        { someProp: "value" },
        {
          anotherProp: {
            nested: [{ rule: "validateMin", message: "Too small" }],
          },
        },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "list.1.anotherProp.nested": {
        type: "validateMin",
        message: "Too small",
      },
    });
  });

  it("covers array with base messages and items in convert function", () => {
    const errors = {
      field: [
        { rule: "rule1", message: "Message 1" },
        { rule: "rule2", message: "Message 2" },
        {
          items: {
            0: [{ rule: "itemRule", message: "Item error" }],
          },
        },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: "Message 1",
    });
  });

  it("covers for loop in walk function with mixed array elements", () => {
    const errors = {
      mixedArray: [
        { rule: "firstError", message: "First error" },
        {
          nestedObj: {
            field: [{ rule: "nestedError", message: "Nested error" }],
          },
        },
        { rule: "thirdError", message: "Third error" },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      mixedArray: { type: "firstError", message: "First error" },
    });
  });

  it("covers empty array with items in convert returning items object", () => {
    const errors = {
      emptyWithItems: {
        length: 0,
        items: {
          0: [{ rule: "itemError", message: "Item error" }],
          1: [{ rule: "anotherItemError", message: "Another item error" }],
        },
      },
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      emptyWithItems: {
        items: {
          0: "Item error",
          1: "Another item error",
        },
      },
    });
  });

  it("covers empty array in nested structure for walk function", () => {
    const errors = {
      parent: {
        emptyChild: [],
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({});
  });

  it("covers empty array in convert function with items", () => {
    const errors = {
      emptyArrayField: [],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({});
  });

  it("covers return outArr in convert function", () => {
    const errors = {
      arrayField: [
        { rule: "error1", message: "Error 1" },
        { rule: "error2", message: "Error 2" },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      arrayField: "Error 1",
    });
  });

  it("forces for loop execution in walk function", () => {
    const errors = {
      complexArray: [
        { rule: "first", message: "First" },
        { nested: { field: [{ rule: "nested", message: "Nested" }] } },
        { another: { field: [{ rule: "another", message: "Another" }] } },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      complexArray: { type: "first", message: "First" },
    });
  });

  it("covers array empty check in convert with items", () => {
    const errors = {
      field: [],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({});
  });

  it("covers object wrapper condition in convert", () => {
    const errors = {
      field: [
        {
          inner: [{ rule: "innerRule", message: "Inner message" }],
        },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: {
        inner: "Inner message",
      },
    });
  });

  it("forces for loop execution with non-error first element", () => {
    const errors = {
      arrayField: [
        { someData: "not an error" },
        { rule: "actualError", message: "Actual error" },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "arrayField.1": { type: "actualError", message: "Actual error" },
    });
  });

  it("covers complex array processing in walk function", () => {
    const errors = {
      complex: [
        { metadata: "info" },
        {
          nested: {
            field: [{ rule: "nestedRule", message: "Nested message" }],
          },
        },
        { rule: "directRule", message: "Direct message" },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      "complex.1.nested.field": {
        type: "nestedRule",
        message: "Nested message",
      },
      "complex.2": { type: "directRule", message: "Direct message" },
    });
  });

  it("handles complex nested structures", () => {
    const errors = {
      company: {
        employees: {
          items: {
            0: [
              {
                personal: {
                  name: [
                    { rule: "validateLengthMin", message: "Name too short" },
                  ],
                  email: [
                    { rule: "validateEmailFormat", message: "Invalid email" },
                  ],
                },
              },
            ],
            2: [
              {
                personal: {
                  phone: [
                    { rule: "validateMobileNumber", message: "Invalid phone" },
                  ],
                },
              },
            ],
          },
        },
      },
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      company: {
        employees: {
          items: {
            0: {
              personal: {
                name: "Name too short",
                email: "Invalid email",
              },
            },
            2: {
              personal: {
                phone: "Invalid phone",
              },
            },
          },
        },
      },
    });
  });

  it("covers nested empty array in walk function", () => {
    const errors = {
      parent: {
        child: [],
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({});
  });

  it("covers array with nested empty array in walk function", () => {
    const errors = {
      list: [{ rule: "first", message: "First" }, { nested: [] }],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      list: { type: "first", message: "First" },
    });
  });

  it("covers array with items and direct errors in walk function", () => {
    const errors = {
      complex: [
        { rule: "direct", message: "Direct error" },
        {
          items: {
            0: [{ rule: "itemError", message: "Item error" }],
          },
        },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      complex: { type: "direct", message: "Direct error" },
    });
  });

  it("covers empty array in convert function with items", () => {
    const errors = {
      field: [],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({});
  });

  it("covers array with single object wrapper in convert", () => {
    const errors = {
      field: [
        {
          inner: [{ rule: "innerRule", message: "Inner message" }],
        },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: {
        inner: "Inner message",
      },
    });
  });

  it("covers array with base messages and items in convert", () => {
    const errors = {
      field: [
        { rule: "baseRule", message: "Base message" },
        {
          items: {
            0: [{ rule: "itemRule", message: "Item message" }],
          },
        },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: "Base message",
    });
  });

  it("covers return outArr branch in convert function", () => {
    const errors = {
      field: [
        { rule: "rule1", message: "Message 1" },
        { rule: "rule2", message: "Message 2" },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: "Message 1",
    });
  });

  it("covers empty array check in walk function", () => {
    const errors = {
      nested: {
        emptyArr: [],
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({});
  });

  it("covers complex array with multiple elements in walk", () => {
    const errors = {
      arr: [
        { rule: "first", message: "First" },
        { other: "data" },
        { rule: "second", message: "Second" },
      ],
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({
      arr: { type: "first", message: "First" },
    });
  });

  it("covers specific return outArr path in convert", () => {
    const errors = {
      field: [
        { rule: "error1", message: "Message 1" },
        { rule: "error2", message: "Message 2" },
      ],
    };
    const result = transformMoldErrorsToFormik(errors);
    expect(result).toEqual({
      field: "Message 1",
    });
  });

  it("covers empty array in specific context", () => {
    const errors = {
      container: {
        empty: [],
      },
    };
    const result = flattenMoldErrorsToRHF(errors);
    expect(result).toEqual({});
  });
});

describe("ValidationError", () => {
  it("creates error with correct properties", () => {
    const errors = { name: "Required" };
    const error = new ValidationError(errors);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ValidationError");
    expect(error.message).toBe("Validation failed");
    expect(error.errors).toEqual(errors);
  });
});
