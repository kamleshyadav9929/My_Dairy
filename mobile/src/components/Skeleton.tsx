import React from 'react';
import { View, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width, 
  height, 
  borderRadius = 8, 
  style 
}) => {
  const { isDark } = useTheme();
  
  // Colors for light/dark mode
  const baseColor = isDark ? '#27272a' : '#e5e7eb'; // zinc-800 : gray-200
  const highlightColor = isDark ? '#3f3f46' : '#d1d5db'; // zinc-700 : gray-300

  return (
    <MotiView
      from={{
        opacity: 0.5,
        backgroundColor: baseColor,
      }}
      animate={{
        opacity: 1,
        backgroundColor: highlightColor,
      }}
      transition={{
        type: 'timing',
        duration: 1000,
        loop: true,
      }}
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
        },
        style
      ]}
    />
  );
};

export const DashboardSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <View>
          <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
          <Skeleton width={180} height={24} />
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Overview Card */}
      <View style={{ height: 200, borderRadius: 16, backgroundColor: colors.card, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={16} />
        </View>
        <Skeleton width={120} height={40} style={{ marginBottom: 24 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.border, paddingTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={20} />
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={40} height={20} />
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={20} />
          </View>
        </View>
      </View>

      {/* Today's Collection */}
      <View style={{ height: 160, borderRadius: 16, backgroundColor: colors.card, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <Skeleton width={120} height={20} />
          <Skeleton width={80} height={16} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={80} height={16} style={{ marginBottom: 6 }} />
            <Skeleton width={120} height={12} />
          </View>
          <Skeleton width={60} height={24} />
        </View>
      </View>
    </View>
  );
};

export const PassbookSkeleton = () => {
    const { colors } = useTheme();
  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Balance Card */}
      <View style={{ height: 180, borderRadius: 16, backgroundColor: colors.card, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
        <Skeleton width={100} height={16} style={{ marginBottom: 16 }} />
        <Skeleton width={140} height={36} style={{ marginBottom: 24 }} />
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, paddingTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={20} />
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={20} />
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
        <Skeleton width={100} height={40} borderRadius={8} />
        <Skeleton width={100} height={40} borderRadius={8} />
        <Skeleton width={100} height={40} borderRadius={8} />
      </View>

      {/* List */}
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border }}>
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
            <Skeleton width={80} height={12} />
          </View>
          <Skeleton width={60} height={16} />
        </View>
      ))}
    </View>
  );
};

export const AlertsSkeleton = () => {
    const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
       <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton width={120} height={24} />
            <Skeleton width={40} height={24} borderRadius={12} />
        </View>
       </View>

      <View style={{ padding: 20 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={{ flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border }}>
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Skeleton width={150} height={16} />
                <Skeleton width={8} height={8} borderRadius={4} />
              </View>
              <Skeleton width="90%" height={12} style={{ marginBottom: 4 }} />
              <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={60} height={10} />
                <Skeleton width={60} height={12} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
