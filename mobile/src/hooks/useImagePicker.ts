import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { getInfoAsync } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { MAX_FILE_SIZE } from '@/constants/config';

interface PickedImage {
  uri: string;
  base64: string;
  fileName: string;
  width: number;
  height: number;
}

export function useImagePicker() {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const requestPermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermission('gallery');
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to select drawings.'
      );
      return;
    }

    setIsPickerOpen(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Check file size
        if (asset.uri) {
          const fileInfo = await getInfoAsync(asset.uri);
          if (fileInfo.exists && 'size' in fileInfo && fileInfo.size > MAX_FILE_SIZE) {
            Alert.alert('File Too Large', 'Please select an image smaller than 50MB.');
            return;
          }
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const fileName = asset.uri.split('/').pop() || 'drawing.jpg';
        setImage({
          uri: asset.uri,
          base64: asset.base64 || '',
          fileName,
          width: asset.width,
          height: asset.height,
        });
      }
    } finally {
      setIsPickerOpen(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant camera access to capture drawings.'
      );
      return;
    }

    setIsPickerOpen(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const fileName = `camera_${Date.now()}.jpg`;
        setImage({
          uri: asset.uri,
          base64: asset.base64 || '',
          fileName,
          width: asset.width,
          height: asset.height,
        });
      }
    } finally {
      setIsPickerOpen(false);
    }
  };

  const clearImage = () => {
    setImage(null);
  };

  return {
    image,
    isPickerOpen,
    pickFromGallery,
    takePhoto,
    clearImage,
  };
}
