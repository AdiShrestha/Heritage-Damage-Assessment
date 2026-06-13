import { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useBatch } from '../hooks/useBatch';
import { useModels } from '../hooks/useModels';
import { ModelSelector } from '../components/ModelSelector';
import { BatchResults } from '../components/BatchResults';
import { HeritageCard } from '../components/HeritageCard';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SPACING, THEME } from '../constants';

const MAX_FILES = 20;

async function pickMultipleImages() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.85,
    selectionLimit: MAX_FILES,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({
    uri: a.uri,
    type: a.mimeType || 'image/jpeg',
    fileName: a.fileName || `image_${Date.now()}.jpg`,
    fileSize: a.fileSize || 0,
  }));
}

export default function BatchScreen() {
  const { models } = useModels();
  const {
    status,
    results,
    error,
    selectedFiles,
    selectedModel,
    addFiles,
    removeFile,
    setModel,
    run,
    reset,
  } = useBatch();

  const isLoading = status === 'loading';

  async function handlePick() {
    const files = await pickMultipleImages();
    if (files.length > 0) addFiles(files);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: THEME.bg }}
      contentContainerStyle={{ padding: SPACING.screen, paddingBottom: 40 }}
    >
      {/* Page header */}
      <View style={{ marginBottom: SPACING.section }}>
        <Text style={{ fontSize: 26, fontWeight: '600', color: THEME.text, letterSpacing: -0.3 }}>
          Batch Assessment
        </Text>
        <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, color: THEME.textMuted }}>
          Select up to {MAX_FILES} photos for parallel damage assessment.
        </Text>
      </View>

      <View style={{ gap: SPACING.section }}>
        {!results ? (
          <>
            {/* Image picker */}
            <HeritageCard>
              <Text style={{ fontSize: 13, fontWeight: '600', color: THEME.text, marginBottom: SPACING.element }}>
                Select Images ({selectedFiles.length}/{MAX_FILES})
              </Text>

              <TouchableOpacity
                onPress={handlePick}
                disabled={isLoading || selectedFiles.length >= MAX_FILES}
                style={{
                  borderRadius: 10,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor:
                    isLoading || selectedFiles.length >= MAX_FILES
                      ? THEME.border
                      : THEME.gold,
                  backgroundColor: THEME.bg,
                  paddingVertical: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isLoading || selectedFiles.length >= MAX_FILES ? 0.6 : 1,
                }}
              >
                <Ionicons name="images-outline" size={36} color={THEME.primary} />
                <Text style={{ marginTop: SPACING.tight, fontSize: 14, fontWeight: '600', color: THEME.text }}>
                  {selectedFiles.length === 0 ? 'Select Photos' : 'Add More Photos'}
                </Text>
                <Text style={{ marginTop: 3, fontSize: 11, color: THEME.textMuted }}>
                  JPEG · PNG · WebP · up to {MAX_FILES} images
                </Text>
              </TouchableOpacity>

              {/* Thumbnail grid */}
              {selectedFiles.length > 0 && (
                <View style={{ marginTop: SPACING.element, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {selectedFiles.map((file) => (
                    <View
                      key={file.uri}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: THEME.border,
                      }}
                    >
                      <Image
                        source={{ uri: file.uri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => removeFile(file.uri)}
                        disabled={isLoading}
                        style={{
                          position: 'absolute',
                          top: 3,
                          right: 3,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: 'rgba(166,58,42,0.9)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </HeritageCard>

            {/* Model selector */}
            <HeritageCard>
              <ModelSelector
                value={selectedModel}
                onChange={setModel}
                models={models}
                disabled={isLoading}
              />
            </HeritageCard>

            {/* Run button */}
            <HeritageCard>
              <TouchableOpacity
                onPress={run}
                disabled={selectedFiles.length === 0 || isLoading}
                style={{
                  backgroundColor:
                    selectedFiles.length === 0 || isLoading ? THEME.border : THEME.primary,
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
                      Processing {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''}…
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="layers" size={18} color={THEME.surface} />
                    <Text style={{ color: THEME.surface, fontSize: 14, fontWeight: '500' }}>
                      {selectedFiles.length > 0
                        ? `Assess ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`
                        : 'Select Images First'}
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
            <LoadingSpinner
              size="lg"
              label={`Processing ${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''}…`}
            />
          </View>
        ) : null}

        {error ? (
          <ErrorAlert title="Batch Failed" message={error.message} onRetry={run} />
        ) : null}

        {results ? (
          <>
            <BatchResults results={results} />
            <TouchableOpacity
              onPress={reset}
              style={{
                borderWidth: 1.5,
                borderColor: THEME.border,
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: SPACING.tight,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: THEME.text }}>
                Process Another Batch
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
