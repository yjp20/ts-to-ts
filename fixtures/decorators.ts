/**
 * This is a comprehensive API model that represents core business entities.
 * It includes validation rules for each field and ensures data integrity.
 * The model is versioned and tracked in our system for audit purposes.
 *
 * Key features:
 * - Unique numeric ID
 * - Alphabetic name validation
 * - Email format validation
 *
 * @model
 */
interface ApiModel {
  /** @decorator minValue(1) */
  id: number;
  /** @decorator pattern("^[A-Za-z]+$") */
  name: string;
  /** @decorator format("email") */
  email: string;
}

/**
 * A simple string with validation
 *
 * @model
 * @decorator pattern("^[A-Za-z0-9]{3,10}$")
 * @decorator minLength(3)
 * @decorator maxLength(10)
 */
type Username = string;

/**
 * Status model with discriminator
 *
 * @model Status
 */
type Status = {
  kind: "success" | "error";
  message: string;
};
