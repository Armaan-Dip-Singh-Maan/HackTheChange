import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { helloFlow } from '../utils/gemini';

export default function GeminiExample() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');

  const generateResponse = async () => {
    setLoading(true);
    setError('');
    try {
      const { text } = await helloFlow('User');
      setResponse(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Gemini Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Gemini AI Example
      </Text>

      <Button
        mode="contained"
        onPress={generateResponse}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Generate Response
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} />
          <Text style={styles.loadingText}>Generating response...</Text>
        </View>
      )}

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : response ? (
        <View style={styles.responseContainer}>
          <Text variant="bodyLarge" style={styles.responseText}>
            {response}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  responseContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 16,
  },
  responseText: {
    lineHeight: 24,
  },
  error: {
    color: '#dc2626',
    marginTop: 16,
    textAlign: 'center',
  },
});