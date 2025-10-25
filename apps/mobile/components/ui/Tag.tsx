import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '@/utils/cn';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  onPress?: () => void;
  className?: string;
}

export function Tag({
  children,
  variant = 'default',
  size = 'md',
  onPress,
  className,
}: TagProps) {
  const baseClasses = 'rounded-full flex-row items-center';
  
  const variantClasses = {
    default: 'bg-blue-100 dark:bg-blue-900',
    secondary: 'bg-gray-100 dark:bg-gray-800',
    success: 'bg-green-100 dark:bg-green-900',
    warning: 'bg-yellow-100 dark:bg-yellow-900',
    error: 'bg-red-100 dark:bg-red-900',
  };

  const textVariantClasses = {
    default: 'text-blue-800 dark:text-blue-200',
    secondary: 'text-gray-800 dark:text-gray-200',
    success: 'text-green-800 dark:text-green-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    error: 'text-red-800 dark:text-red-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      <Text
        className={cn(
          'font-medium',
          textVariantClasses[variant],
          textSizeClasses[size]
        )}
      >
        {children}
      </Text>
    </Component>
  );
}
