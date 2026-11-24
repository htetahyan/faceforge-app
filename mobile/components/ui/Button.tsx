import * as React from 'react';
import { TouchableOpacity, TouchableOpacityProps, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '../../lib/utils';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'text';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textClassName?: string;
}

const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  (
    {
      title,
      variant = 'primary',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      textClassName,
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === 'primary';
    const isOutline = variant === 'outline';
    const isText = variant === 'text';

    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        ref={ref}
        disabled={isDisabled}
        activeOpacity={0.85}
        className={cn(
          'h-12 rounded-full justify-center items-center flex-row px-5 w-full',
          isPrimary && 'bg-[#E60023] active:bg-[#BD081C]',
          isOutline && 'bg-white border border-gray-200 active:bg-gray-50',
          isText && 'bg-transparent h-auto px-0 py-2',
          isDisabled && 'bg-gray-100 border-gray-100 opacity-60',
          className
        )}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            color={isPrimary ? '#FFFFFF' : '#E60023'}
            size="small"
          />
        ) : (
          <View className="flex-row items-center justify-center">
            {leftIcon && <View className="mr-2">{leftIcon}</View>}
            <Text
              className={cn(
                'text-sm font-semibold',
                isPrimary && 'text-white',
                isOutline && 'text-[#E60023]',
                isText && 'text-[#E60023]',
                isDisabled && 'text-gray-400',
                textClassName
              )}
            >
              {title}
            </Text>
            {rightIcon && <View className="ml-2">{rightIcon}</View>}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

export { Button };
