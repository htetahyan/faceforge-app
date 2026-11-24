import * as React from 'react';
import { cn } from '@/lib/utils';
import { Platform, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      className,
      label,
      leftIcon,
      rightIcon,
      error,
      containerClassName,
      secureTextEntry,
      editable,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = secureTextEntry;

    return (
      <View className={cn('w-full mb-4', containerClassName)}>
        {label && (
          <Text className="text-[13px] font-semibold text-[#2C2536] mb-1.5">
            {label}
          </Text>
        )}
        <View
          className={cn(
            'flex-row items-center h-12 border border-gray-200 rounded-xl bg-white px-3.5',
            error && 'border-red-500',
            editable === false && 'bg-gray-100 opacity-60'
          )}
        >
          {leftIcon && <View className="mr-2.5 justify-center items-center">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className={cn(
              'dark:bg-input/30 text-[#111111] flex-1 h-full min-w-0 text-sm leading-5 shadow-black/5 bg-transparent border-0 outline-none focus:outline-none web:ring-0 web:outline-none',
              editable === false &&
              cn(
                'opacity-50',
                Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
              ),
              Platform.select({
                web: cn(
                  'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow]',
                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
                ),
                native: 'placeholder:text-muted-foreground/50',
              }),
              className
            )}
            secureTextEntry={isPassword && !showPassword}
            editable={editable}
            style={[
              Platform.OS === 'web' ? { outlineStyle: 'none' } as any : undefined,
              props.style
            ]}
            {...props}
          />
          {isPassword ? (
            <TouchableOpacity
              className="ml-2.5 justify-center items-center h-full px-1"
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#726580"
              />
            </TouchableOpacity>
          ) : (
            rightIcon && <View className="ml-2.5 justify-center items-center">{rightIcon}</View>
          )}
        </View>
        {error && (
          <Text className="text-xs text-red-500 mt-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
