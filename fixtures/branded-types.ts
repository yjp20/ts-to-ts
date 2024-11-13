/** @model */
type EmailAddress = string & { __brand: "email" };

/** @model */
type UserId = number & { __brand: "userId" };

/** @model */
type PositiveNumber = number & { __brand: "positive" };

/** @model */
interface ValidatedUser {
  email: EmailAddress;
  id: UserId;
  score: PositiveNumber;
}
