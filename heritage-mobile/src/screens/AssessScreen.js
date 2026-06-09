import { useState } from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrediction } from '../hooks/usePrediction';
import { useModels } from '../hooks/useModels';
import { ImageDropzone } from '../components/ImageDropzone';
import { CameraScanner } from '../components/CameraScanner';
import { ModelSelector } from '../components/ModelSelector';
import { ResultCard } from '../components/ResultCard';
import { HeritageCard } from '../components/HeritageCard';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatFileSize } from '../utils/image';
import { SPACING, THEME } from '../constants';

export default function AssessScreen() {
  const { models } = useModels();
  const { status, result, error, selectedFile, preview, selectedModel, setFile, setModel, run, reset } = usePrediction();
  const [previewLabel, setPreviewLabel] = useState(null);
  const [mode, setMode] = useState('upload');
  const [showScanner, setShowScanner] = useState(false);

  function handleFile(file) {
    setPreviewLabel({ name: file.fileName || 'Image', size: file.fileSize || 0 });
    setFile(file);
  }

  function handleScanCapture(file) {
    setShowScanner(false);
    setPreviewLabel({ name: file.fileName || 'Scan', size: file.fileSize || 0 });
    setFile(file);
  }

  function handleReset() {
    setPreviewLabel(null);
    reset();
  }

  function handleRun() {
    if (!selectedFile) return;
    run();
  }

  const showEmptyState = (status === 'idle' || status === 'error') && !result;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: THEME.bg }}
      contentContainerStyle={{ padding: SPACING.screen, paddingBottom: 32 }}
    >
      <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
        <CameraScanner
          onCapture={handleScanCapture}
          onClose={() => setShowScanner(false)}
        />
      </Modal>

      <View style={{ marginBottom: SPACING.section }}>
        <Text style={{ fontSize: 26, fontWeight: '600', color: THEME.text, letterSpacing: -0.3 }}>
          Damage Assessment
        </Text>
        <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, color: THEME.textMuted }}>
          Upload a photo or scan a heritage structure to classify its damage level.
        </Text>
      </View>

      <View style={{ gap: SPACING.section }}>
        <HeritageCard>
          <View style={{
            flexDirection: 'row',
            marginBottom: SPACING.element,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: THEME.border,
            overflow: 'hidden',
          }}>
            <TouchableOpacity
              onPress={() => setMode('upload')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                backgroundColor: mode === 'upload' ? THEME.primary : 'transparent',
              }}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={mode === 'upload' ? THEME.surface : THEME.stone} />
              <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 2, color: mode === 'upload' ? THEME.surface : THEME.stone }}>
                Upload
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('scan')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                backgroundColor: mode === 'scan' ? THEME.primary : 'transparent',
              }}
            >
              <Ionicons name="scan-outline" size={18} color={mode === 'scan' ? THEME.surface : THEME.stone} />
              <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 2, color: mode === 'scan' ? THEME.surface : THEME.stone }}>
                Scan
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, fontWeight: '600', color: THEME.text, marginBottom: SPACING.element }}>
            {mode === 'upload' ? 'Select Image' : 'Live Scan'}
          </Text>

          {mode === 'upload' ? (
            <ImageDropzone onFile={handleFile} disabled={status === 'loading'} />
          ) : (
            <TouchableOpacity
              onPress={() => setShowScanner(true)}
              disabled={status === 'loading'}
              style={{
                minHeight: 200,
                borderRadius: 12,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: status === 'loading' ? THEME.border : THEME.gold,
                backgroundColor: THEME.bg,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 24,
                opacity: status === 'loading' ? 0.6 : 1,
              }}
            >
              <Ionicons name="scan" size={40} color={THEME.primary} />
              <Text style={{ marginTop: SPACING.element, fontSize: 15, fontWeight: '600', color: THEME.text }}>
                Open Camera
              </Text>
              <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, color: THEME.textMuted, textAlign: 'center' }}>
                Point at a heritage structure to scan
              </Text>
            </TouchableOpacity>
          )}

          {selectedFile && preview ? (
            <View style={{
              marginTop: SPACING.element,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: THEME.border,
              backgroundColor: THEME.primaryPale,
              padding: SPACING.element,
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.element,
            }}>
              <Image
                source={{ uri: preview }}
                style={{ width: 64, height: 64, borderRadius: 8 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: THEME.text }} numberOfLines={1}>
                  {previewLabel?.name}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 11, color: THEME.textMuted }}>
                  {formatFileSize(previewLabel?.size || 0)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleReset}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close" size={16} color={THEME.textMuted} />
              </TouchableOpacity>
            </View>
          ) : null}
        </HeritageCard>

        <HeritageCard>
          <ModelSelector value={selectedModel} onChange={setModel} models={models} disabled={status === 'loading'} />
        </HeritageCard>

        <HeritageCard>
          <TouchableOpacity
            onPress={handleRun}
            disabled={!selectedFile || status === 'loading'}
            style={{
              backgroundColor: !selectedFile || status === 'loading' ? THEME.border : THEME.primary,
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: SPACING.tight,
            }}
          >
            {status === 'loading' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.tight }}>
                <LoadingSpinner size="sm" />
                <Text style={{ color: THEME.surface, fontSize: 14, fontWeight: '500' }}>Analysing...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="search" size={18} color={THEME.surface} />
                <Text style={{ color: THEME.surface, fontSize: 14, fontWeight: '500' }}>Run Assessment</Text>
              </>
            )}
          </TouchableOpacity>

          {status === 'idle' && selectedFile ? (
            <Text style={{ marginTop: SPACING.element, fontSize: 12, color: THEME.textMuted, textAlign: 'center' }}>
              Results appear below after analysis.
            </Text>
          ) : null}
        </HeritageCard>

        {status === 'error' && error ? (
          <ErrorAlert title="Assessment Failed" message={error.message} onRetry={handleRun} />
        ) : null}

        {status === 'loading' ? (
          <View style={{
            minHeight: 300,
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: THEME.border,
            backgroundColor: THEME.surface,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}>
            <LoadingSpinner size="lg" label="Running inference..." />
          </View>
        ) : showEmptyState ? (
          <View style={{
            minHeight: 300,
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: THEME.border,
            backgroundColor: THEME.surface,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}>
            <Ionicons name="business-outline" size={56} color={THEME.border} />
            <Text style={{ marginTop: SPACING.element, fontSize: 18, fontWeight: '600', color: THEME.text }}>
              No Assessment Yet
            </Text>
            <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, color: THEME.textMuted, textAlign: 'center' }}>
              {mode === 'upload'
                ? 'Upload an image and run the model to see results here.'
                : 'Scan a heritage structure to get an instant assessment.'}
            </Text>
          </View>
        ) : result ? (
          <ResultCard result={result} originalUri={preview} />
        ) : null}
      </View>
    </ScrollView>
  );
}
