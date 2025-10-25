import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { cn } from '@/utils/cn';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  loading = false,
  disabled = false,
  variant = 'default',
  size = 'md',
  className,
  style,
  textStyle,
}: ButtonProps) {
  const baseClasses = 'flex-row items-center justify-center rounded-lg';
  
  const variantClasses = {
    default: 'bg-blue-600 active:bg-blue-700',
    outline: 'border border-blue-600 bg-transparent active:bg-blue-50',
    ghost: 'bg-transparent active:bg-gray-100',
    destructive: 'bg-red-600 active:bg-red-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textVariantClasses = {
    default: 'text-white',
    outline: 'text-blue-600',
    ghost: 'text-gray-700 dark:text-gray-300',
    destructive: 'text-white',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-50',
        className
      )}
      style={style}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? '#3b82f6' : 'white'} 
          className="mr-2"
        />
      )}
      <Text
        className={cn(
          'font-medium',
          textVariantClasses[variant],
          textSizeClasses[size],
          isDisabled && 'opacity-50'
        )}
        style={textStyle}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
