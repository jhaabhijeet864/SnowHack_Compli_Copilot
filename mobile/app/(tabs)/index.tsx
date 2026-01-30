import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { processReceipt, parseTextDirectly, ReceiptData } from '@/services/receiptProcessor';

type InputMode = 'image' | 'text';

export default function ReceiptProcessorScreen() {
  const [selectedImage, setSelectedImage] = useState<{ uri: string } | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('image');

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access photos is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage({ uri: result.assets[0].uri });
      setResult('');
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access camera is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage({ uri: result.assets[0].uri });
      setResult('');
    }
  };

  const handleProcessImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    setIsProcessing(true);
    setResult('');
    setDownloadProgress(null);

    try {
      const receiptData = await processReceipt(
        selectedImage.uri,
        (progress) => setDownloadProgress(progress)
      );
      setDownloadProgress(null);
      setResult(JSON.stringify(receiptData, null, 2));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessText = async () => {
    if (!manualText.trim()) {
      Alert.alert('No Text', 'Please enter receipt text first.');
      return;
    }

    setIsProcessing(true);
    setResult('');
    setDownloadProgress(null);

    try {
      const receiptData = await parseTextDirectly(
        manualText,
        (progress) => setDownloadProgress(progress)
      );
      setDownloadProgress(null);
      setResult(JSON.stringify(receiptData, null, 2));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Receipt Processor</ThemedText>
      </ThemedView>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'image' && styles.modeButtonActive]}
          onPress={() => setInputMode('image')}
        >
          <Text style={[styles.modeButtonText, inputMode === 'image' && styles.modeButtonTextActive]}>
            Image + OCR
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'text' && styles.modeButtonActive]}
          onPress={() => setInputMode('text')}
        >
          <Text style={[styles.modeButtonText, inputMode === 'text' && styles.modeButtonTextActive]}>
            Manual Text
          </Text>
        </TouchableOpacity>
      </View>

      {inputMode === 'image' ? (
        <>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleSelectImage}>
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <ThemedText style={styles.uriText}>
              Selected: {selectedImage.uri.split('/').pop()}
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.processButton,
              (!selectedImage || isProcessing) && styles.processButtonDisabled,
            ]}
            onPress={handleProcessImage}
            disabled={!selectedImage || isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.processButtonText}>
                  {downloadProgress !== null
                    ? `Downloading Model: ${Math.round(downloadProgress * 100)}%`
                    : 'Processing...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.processButtonText}>Process Image</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Paste or type receipt text here...&#10;&#10;Example:&#10;STORE: ABC Mart&#10;DATE: 2026-01-30&#10;TOTAL: $25.99&#10;GSTIN: 29AABCU9603R1ZM"
            placeholderTextColor="#999"
            value={manualText}
            onChangeText={setManualText}
          />

          <TouchableOpacity
            style={[
              styles.processButton,
              (!manualText.trim() || isProcessing) && styles.processButtonDisabled,
            ]}
            onPress={handleProcessText}
            disabled={!manualText.trim() || isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.processButtonText}>
                  {downloadProgress !== null
                    ? `Downloading Model: ${Math.round(downloadProgress * 100)}%`
                    : 'Processing...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.processButtonText}>Parse Text</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {downloadProgress !== null && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${downloadProgress * 100}%` }]} />
        </View>
      )}

      <ScrollView style={styles.resultContainer}>
        <ThemedText style={styles.resultLabel}>Result:</ThemedText>
        <ThemedText style={styles.resultText}>{result || 'No result yet'}</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
    paddingHorizontal: 16,
  },
  titleContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uriText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 150,
    textAlignVertical: 'top',
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  processButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  processButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  resultContainer: {
    flex: 1,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  resultLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
});
