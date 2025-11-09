import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// fake data
const leaderboardData = {
  leaderboard_title: 'Top CO₂ Savers',
  unit: 'kg CO₂e saved',
  last_updated: '2025-11-08T12:00:00Z',
  entries: [
    { rank: 2, username: 'GreenThumb99', co2_saved_kg: 11890.3 },
    { rank: 1, username: 'EcoWarrior42', co2_saved_kg: 12450.7 },
    { rank: 3, username: 'ZeroWasteNinja', co2_saved_kg: 10320.0 },
    { rank: 4, username: 'SolarSam', co2_saved_kg: 9870.5 },
    { rank: 5, username: 'ForestFriend', co2_saved_kg: 9120.8 },
    { rank: 6, username: 'BikeCommuterPro', co2_saved_kg: 8750.2 },
    { rank: 7, username: 'VeganVanguard', co2_saved_kg: 8200.0 },
    { rank: 8, username: 'WindPowerFan', co2_saved_kg: 7800.4 },
    { rank: 9, username: 'RecycleMaster', co2_saved_kg: 7300.9 },
    { rank: 10, username: 'CarbonCrusader', co2_saved_kg: 6900.1 },
  ],
};

export default function LeaderboardModern() {
  const topThree = leaderboardData.entries.slice(0, 3);
  const others = leaderboardData.entries.slice(3);

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        {leaderboardData.leaderboard_title}
      </Text>

      {/* Top 3 podium section */}
      <View style={styles.topThreeContainer}>
        {topThree.map((entry, index) => (
          <View
            key={entry.rank}
            style={[
              styles.topCard,
              index === 1 && styles.middleCard, // 1st place center and higher
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

      {/* Table Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 0.5 }]}>#</Text>
        <Text style={[styles.headerText, { flex: 2 }]}>User</Text>
        <Text style={[styles.headerText, { flex: 1.2, textAlign: 'right' }]}>CO₂ Saved</Text>
      </View>

      {/* Rest of leaderboard */}
      {others.map((entry) => (
        <View key={entry.rank} style={styles.row}>
          <Text style={styles.rank}>{entry.rank}</Text>
          <Text style={styles.name}>{entry.username}</Text>
          <Text style={styles.value}>
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

  // --- Top 3 Section ---
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  topCard: {
    alignItems: 'center',
    backgroundColor: '#6b53cbff',
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

  //  Table Layout for Rest
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
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
    borderColor: '#eee',
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