/** @convert */
type ConvertMe = string;

type SkipMe = number;

/** @convert */
interface UserInfo {
  name: string;
  age: number;
}

interface IgnoreMe {
  data: string;
}
