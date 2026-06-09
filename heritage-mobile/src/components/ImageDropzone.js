import { Alert, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { validateFile } from '../utils/image';
import { MAX_FILE_MB, SPACING, THEME } from '../constants';

export function ImageDropzone({ onFile, disabled = false }) {
  async function handlePick() {
    if (disabled) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera roll access is needed to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const file = {
      uri: asset.uri,
      type: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || 'image.jpg',
      fileSize: asset.fileSize || 0,
      width: asset.width,
      height: asset.height,
    };

    const validation = validateFile(file);
    if (!validation.valid) {
      Alert.alert('Invalid File', validation.error);
      return;
    }

    onFile(file);
  }

  return (
    <TouchableOpacity
      onPress={handlePick}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      style={{
        minHeight: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: disabled ? THEME.border : THEME.brick,
        backgroundColor: disabled ? THEME.bg : THEME.surface,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.section,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Ionicons name="cloud-upload-outline" size={40} color={THEME.primary} />
      <Text style={{ marginTop: SPACING.element, fontSize: 15, fontWeight: '600', color: THEME.text }}>
        Tap to select an image
      </Text>
      <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, color: THEME.textMuted }}>
        JPEG · PNG · WebP · Max {MAX_FILE_MB}MB
      </Text>
    </TouchableOpacity>
  );
}
