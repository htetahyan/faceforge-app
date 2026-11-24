import React from 'react';
import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';

type NativeOnlyAnimatedViewProps = React.ComponentProps<typeof Animated.View>;

function NativeOnlyAnimatedView({ children, ...props }: NativeOnlyAnimatedViewProps) {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  } else {
    return <Animated.View {...props}>{children}</Animated.View>;
  }
}

export { NativeOnlyAnimatedView };
