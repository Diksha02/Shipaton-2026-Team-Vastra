/**
 * Static asset module declarations.
 *
 * Metro resolves `import x from './photo.jpg'` to an asset reference at build
 * time, but Expo SDK 57 ships no ambient types for it, so TypeScript treats
 * every image import as a missing module. These declarations describe what
 * Metro actually returns.
 *
 * Kept separate from `expo-env.d.ts`, which is generated and marked not to be
 * edited.
 */

declare module '*.jpg' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}

declare module '*.jpeg' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}

declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}

declare module '*.webp' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}

declare module '*.svg' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}
