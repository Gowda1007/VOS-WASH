// This file is necessary to make TypeScript understand imports of image files.
// It tells TypeScript that importing an image file will result in a module
// with a default export that can be used as the `src` for an `<img>` tag.

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}
