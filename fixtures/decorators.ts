/**
 * This is a comprehensive API model that represents core business entities.
 * It includes validation rules for each field and ensures data integrity.
 * The model is versioned and tracked in our system for audit purposes.
 * 
 * Key features:
 * - Unique numeric ID
 * - Alphabetic name validation
 * - Email format validation
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
 * @model
 * @doc A simple string with validation
 * @decorator pattern("^[A-Za-z0-9]{3,10}$")
 * @decorator minLength(3)
 * @decorator maxLength(10)
 */
type Username = string;

/**
 * @model Status
 * @doc Status model with discriminator
 */
type Status = {
  kind: "success" | "error";
  message: string;
};
