import { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useComparison } from '../hooks/useComparison';
import { ComparisonResult } from '../components/ComparisonResult';
import { HeritageCard } from '../components/HeritageCard';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SPACING, THEME } from '../constants';

async function pickImage() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    type: asset.mimeType || 'image/jpeg',
    fileName: asset.fileName || 'image.jpg',
    fileSize: asset.fileSize || 0,
  };
}

function ImageSlot({ label, file, preview, onPick, disabled }) {
  return (
    <HeritageCard>
      <Text style={{ fontSize: 13, fontWeight: '600', color: THEME.text, marginBottom: SPACING.element }}>
        {label}
      </Text>

      {preview ? (
        <View>
          <Image
            source={{ uri: preview }}
            style={{ width: '100%', height: 160, borderRadius: 10 }}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={onPick}
            disabled={disabled}
            style={{
              marginTop: SPACING.tight,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: THEME.border,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, color: THEME.textMuted }}>Change Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onPick}
          disabled={disabled}
          style={{
            minHeight: 130,
            borderRadius: 10,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: disabled ? THEME.border : THEME.gold,
            backgroundColor: THEME.bg,
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.element,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Ionicons name="image-outline" size={32} color={THEME.primary} />
          <Text style={{ marginTop: SPACING.tight, fontSize: 13, fontWeight: '600', color: THEME.text }}>
            Select Photo
          </Text>
          <Text style={{ marginTop: 2, fontSize: 11, color: THEME.textMuted }}>
            JPEG · PNG · WebP
          </Text>
        </TouchableOpacity>
      )}
    </HeritageCard>
  );
}

export default function CompareScreen() {
  const {
    status,
    result,
    error,
    fileT1,
    fileT2,
    previewT1,
    previewT2,
    siteId,
    setSiteId,
    setFileT1,
    setFileT2,
    run,
    reset,
  } = useComparison();

  const isLoading = status === 'loading';

  async function handlePickT1() {
    const file = await pickImage();
    if (file) setFileT1(file);
  }

  async function handlePickT2() {
    const file = await pickImage();
    if (file) setFileT2(file);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: THEME.bg }}
      contentContainerStyle={{ padding: SPACING.screen, paddingBottom: 40 }}
    >
      {/* Page header */}
      <View style={{ marginBottom: SPACING.section }}>
        <Text style={{ fontSize: 26, fontWeight: '600', color: THEME.text, letterSpacing: -0.3 }}>
          Temporal Comparison
        </Text>
        <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, color: THEME.textMuted }}>
          Upload two photos of the same site to detect deterioration.
        </Text>
      </View>

      <View style={{ gap: SPACING.section }}>
        {/* Image slots — only shown when no result yet */}
        {!result ? (
          <>
            <ImageSlot
              label="Earlier Survey"
              file={fileT1}
              preview={previewT1}
              onPick={handlePickT1}
              disabled={isLoading}
            />
            <ImageSlot
              label="Later Survey"
              file={fileT2}
              preview={previewT2}
              onPick={handlePickT2}
              disabled={isLoading}
            />

            {/* Site ID input */}
            <HeritageCard>
              <Text style={{ fontSize: 13, fontWeight: '600', color: THEME.text, marginBottom: 6 }}>
                Site ID (Optional)
              </Text>
              <TextInput
                value={siteId}
                onChangeText={setSiteId}
                placeholder="Enter site identifier for tracking"
                placeholderTextColor={THEME.textMuted}
                editable={!isLoading}
                style={{
                  borderWidth: 1,
                  borderColor: THEME.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 13,
                  color: THEME.text,
                  backgroundColor: THEME.surface,
                }}
              />
            </HeritageCard>

            {/* Run button */}
            <HeritageCard>
              <TouchableOpacity
                onPress={run}
                disabled={!fileT1 || !fileT2 || isLoading}
                style={{
                  backgroundColor:
                    !fileT1 || !fileT2 || isLoading ? THEME.border : THEME.primary,
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: SPACING.tight,
                }}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <Text style={{ color: THEME.surface, fontSize: 14, fontWeight: '500' }}>
                      Comparing...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="git-compare" size={18} color={THEME.surface} />
                    <Text style={{ color: THEME.surface, fontSize: 14, fontWeight: '500' }}>
                      Compare Images
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </HeritageCard>
          </>
        ) : null}

        {isLoading ? (
          <View
            style={{
              minHeight: 200,
              borderRadius: 12,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: THEME.border,
              backgroundColor: THEME.surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <LoadingSpinner size="lg" label="Analysing images..." />
          </View>
        ) : null}

        {error ? (
          <ErrorAlert title="Comparison Failed" message={error.message} onRetry={run} />
        ) : null}

        {result ? (
          <>
            <ComparisonResult result={result} />
            <TouchableOpacity
              onPress={reset}
              style={{
                borderWidth: 1.5,
                borderColor: THEME.border,
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: THEME.text }}>
                Compare Another Pair
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
