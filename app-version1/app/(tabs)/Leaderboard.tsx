import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase/firebaseConfig';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';

export default function LeaderboardModern() {

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#fff' : '#000';

  const [leaderboardData, setLeaderboardData] = useState<{
    leaderboard_title: string;
    unit: string;
    last_updated: string;
    entries: { rank: number; username: string; co2_saved_kg: number }[];
  }>({
    leaderboard_title: 'Top CO₂ Savers',
    unit: 'kg CO₂e saved',
    last_updated: new Date().toISOString(),
    entries: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('lifetimeCO2Kg', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const entries = snap.docs.map((d, idx) => {
          const data = d.data() as any;
          const username =
            data?.username ||
            (data?.email ? String(data.email).split('@')[0] : 'User');
          const co2 = typeof data?.lifetimeCO2Kg === 'number' ? data.lifetimeCO2Kg : 0;
          return { rank: idx + 1, username, co2_saved_kg: co2 };
        });

        setLeaderboardData((prev) => ({
          ...prev,
          last_updated: new Date().toISOString(),
          entries,
        }));
      } catch (e) {
        console.error('Leaderboard load error:', e);
        setLeaderboardData((prev) => ({ ...prev, entries: [] }));
      }
    };
    load();
  }, []);

  const entries = leaderboardData.entries;
  const topThree = entries.slice(0, 3);
  const podium = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
  const others = entries.slice(3);

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <Text variant="headlineLarge" style={styles.title}>
        {leaderboardData.leaderboard_title}
      </Text>

      <View style={styles.topThreeContainer}>
        {podium.map((entry, index) => (
          <View
            key={entry.rank}
            style={[
              styles.topCard,
              index === 1 && styles.middleCard,
            ]}
          >
            <View
              style={[
                styles.circle,
                index === 1 && styles.circleLarge,
              ]}
            >
              {entry.rank === 1 ? (
                <MaterialCommunityIcons name="crown" size={40} color="#FFD700" />
              ) : (
                <Text style={styles.rankNumber}>{entry.rank}</Text>
              )}
            </View>

            <Text style={styles.topName}>{entry.username}</Text>
            <Text style={styles.topValue}>
              {entry.co2_saved_kg.toLocaleString()} {leaderboardData.unit.split(' ')[0]}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 0.5, color: textColor }]}>#</Text>
        <Text style={[styles.headerText, { flex: 2, color: textColor }]}>User</Text>
        <Text style={[styles.headerText, { flex: 1.2, textAlign: 'right', color: textColor }]}>CO₂ Saved</Text>
      </View>

      {others.map((entry) => (
        <View key={entry.rank} style={styles.row}>
          <Text style={[styles.rank, { color: isDark ? '#fff' : '#000' }]}>{entry.rank}</Text>
          <Text style={[styles.name, { color: isDark ? '#fff' : '#000' }]}>{entry.username}</Text>
          <Text style={[styles.value, { color: isDark ? '#fff' : '#000' }]}>
            {entry.co2_saved_kg.toLocaleString()} {leaderboardData.unit.split(' ')[0]}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F7',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  topCard: {
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 16,
    padding: 10,
    width: 100,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  middleCard: {
    transform: [{ translateY: -20 }],
    width: 120,
    height: 170,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  circleLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  secondCircle: {
    borderColor: '#C0C0C0',
  },
  thirdCircle: {
    borderColor: '#CD7F32',
  },
  rankNumber: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  topName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  topValue: {
    color: '#C8E6C9',
    fontSize: 13,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.8)',
    marginBottom: 6,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#444',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(22, 163, 74, 0.0)',
  },
  rank: {
    flex: 0.5,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  name: {
    flex: 2,
    fontSize: 16,
    color: '#333',
  },
  value: {
    flex: 1.2,
    fontSize: 15,
    color: '#388E3C',
    textAlign: 'right',
  },
});