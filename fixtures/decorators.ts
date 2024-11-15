/**
 * @model
 * @decorator doc("A versioned API model")
 * @decorator versioned
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
 * @decorator doc("A simple string with validation")
 * @decorator pattern("^[A-Za-z0-9]{3,10}$")
 * @decorator minLength(3)
 * @decorator maxLength(10)
 */
type Username = string;

/**
 * @model Status
 * @decorator discriminator("kind")
 */
type Status = {
  kind: "success" | "error";
  message: string;
};
