/** @model */
interface TreeNode {
  value: string;
  children?: TreeNode[];
}

/** @model */
type LinkedList<T> = {
  value: T;
  next?: LinkedList<T>;
};

/** @model */
interface Comment {
  id: number;
  text: string;
  replies?: Comment[];
  parent?: Comment;
}
