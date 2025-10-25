import { TextInput, View, Text, TextInputProps } from 'react-native';
import { cn } from '@/utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn('space-y-2', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && (
        <Text className="text-sm text-red-600 dark:text-red-400">
          {error}
        </Text>
      )}
    </View>
  );
}
