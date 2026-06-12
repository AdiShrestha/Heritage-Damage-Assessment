import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants';

export function CameraScanner({ onCapture, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [capturing, setCapturing] = useState(false);

  if (!permission) {
    return (
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Checking camera permission...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Ionicons name="camera" size={48} color={THEME.gold} />
          <Text style={styles.title}>Camera Access Needed</Text>
          <Text style={styles.subtitle}>
            Point your camera at a heritage structure to get an instant damage assessment.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={requestPermission}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Grant Access</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      const file = {
        uri: photo.uri,
        type: 'image/jpeg',
        fileName: `scan_${Date.now()}.jpg`,
        fileSize: photo.exif?.FileSize || 0,
        width: photo.width,
        height: photo.height,
      };
      onCapture(file);
    } catch {
      Alert.alert('Capture Failed', 'Could not capture image. Please try again.');
    } finally {
      setCapturing(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        ratio="4:3"
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={THEME.surface} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.scanHint}>Align heritage structure in frame</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.captureArea}>
        <TouchableOpacity
          onPress={handleCapture}
          disabled={capturing}
          style={styles.captureButton}
          activeOpacity={0.7}
        >
          <View style={capturing ? styles.captureInnerDisabled : styles.captureInner} />
        </TouchableOpacity>
      </View>

      {capturing && (
        <View style={styles.capturingOverlay}>
          <Text style={styles.capturingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.text,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.surface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: THEME.stoneLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: THEME.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: THEME.stone,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: THEME.stoneLight,
    fontSize: 14,
    fontWeight: '500',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(28, 24, 22, 0.6)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanHint: {
    color: THEME.surface,
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
  captureArea: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.surface,
  },
  captureInnerDisabled: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.stone,
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 24, 22, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingText: {
    color: THEME.surface,
    fontSize: 18,
    fontWeight: '600',
  },
});
