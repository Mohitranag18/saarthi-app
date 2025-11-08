import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Help & Support</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.question}>How do I report an accessibility issue?</Text>
            <Text style={styles.answer}>
              Navigate to the Report tab and fill out the form with details about the accessibility issue you've encountered.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.question}>How can I become a volunteer?</Text>
            <Text style={styles.answer}>
              Register for an account and select "Volunteer" as your user type. You'll then be able to help with accessibility reports.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.question}>What is the emergency feature?</Text>
            <Text style={styles.answer}>
              The emergency button allows you to quickly request help in critical situations. It will notify nearby volunteers and emergency services.
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.contactText}>
            For additional support, please email us at: help@saarthi.app
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  faqItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
