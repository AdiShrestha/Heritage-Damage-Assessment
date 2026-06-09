import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeritageCard } from '../components/HeritageCard';
import { DamageLabel } from '../components/DamageLabel';
import { SPACING, THEME } from '../constants';

function SectionTitle({ children }) {
  return <Text style={{ fontSize: 18, fontWeight: '600', color: THEME.text, marginBottom: SPACING.element }}>{children}</Text>;
}

function Card({ title, description }) {
  return (
    <HeritageCard>
      <Text style={{ fontSize: 15, fontWeight: '600', color: THEME.text }}>{title}</Text>
      <Text style={{ marginTop: SPACING.tight, fontSize: 13, lineHeight: 20, color: THEME.textMuted }}>{description}</Text>
    </HeritageCard>
  );
}

function TeamCard({ name, id, role }) {
  return (
    <HeritageCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.element }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: THEME.primaryPale,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name="person" size={20} color={THEME.primary} />
        </View>
        <View>
          <Text style={{ fontWeight: '600', color: THEME.text }}>{name}</Text>
          <Text style={{ fontSize: 12, color: THEME.textMuted }}>{id}</Text>
        </View>
      </View>
      <Text style={{ marginTop: SPACING.tight, fontSize: 13, color: THEME.textMuted }}>{role}</Text>
    </HeritageCard>
  );
}

export default function AboutScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: THEME.bg }}
      contentContainerStyle={{
        padding: SPACING.screen,
        paddingBottom: 32,
        gap: SPACING.section,
      }}
    >
      <HeritageCard>
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.6, color: THEME.primary }}>
          KATHMANDU UNIVERSITY · COMP 488
        </Text>
        <Text style={{ marginTop: SPACING.tight, fontSize: 24, fontWeight: '600', color: THEME.text, letterSpacing: -0.3 }}>
          Cultural Heritage Damage Assessment
        </Text>
        <Text style={{ marginTop: SPACING.element, fontSize: 13, lineHeight: 22, color: THEME.textMuted }}>
          An AI-assisted mobile system for quickly classifying damage levels in images of heritage structures and
          showing where the model focused using Grad-CAM heatmaps.
        </Text>
      </HeritageCard>

      <View>
        <SectionTitle>The Problem</SectionTitle>
        <Text style={{ fontSize: 13, lineHeight: 22, color: THEME.textMuted }}>
          Heritage structures in Nepal are exposed to earthquakes, weathering, pollution, and age-related decay.
          Manual inspection is slow and resource-intensive, especially for UNESCO sites and remote monuments. A fast
          screening tool helps prioritize field visits and restoration work.
        </Text>
      </View>

      <View>
        <SectionTitle>Our Approach</SectionTitle>
        <View style={{ gap: SPACING.element }}>
          <Card title="Deep Learning" description="Transfer learning with CNN and transformer backbones such as ResNet50, EfficientNet, and ViT." />
          <Card title="Grad-CAM" description="Explainability overlays highlight structural regions most influential to the damage prediction." />
          <Card title="Mobile Interface" description="Scan or select a photo and receive an instant assessment with confidence scores and visual evidence." />
        </View>
      </View>

      <View>
        <SectionTitle>Damage Classes</SectionTitle>
        <View style={{ gap: SPACING.element }}>
          <HeritageCard>
            <DamageLabel label="Undamaged" confidence={1} size="md" />
            <Text style={{ marginTop: SPACING.element, fontSize: 13, lineHeight: 20, color: THEME.textMuted }}>
              The structure appears intact with no visible major deterioration requiring immediate intervention.
            </Text>
          </HeritageCard>
          <HeritageCard>
            <DamageLabel label="Partial Damage" confidence={1} size="md" />
            <Text style={{ marginTop: SPACING.element, fontSize: 13, lineHeight: 20, color: THEME.textMuted }}>
              Localized cracking, erosion, or surface damage is present, but the structure remains largely stable.
            </Text>
          </HeritageCard>
          <HeritageCard>
            <DamageLabel label="Damaged" confidence={1} size="md" />
            <Text style={{ marginTop: SPACING.element, fontSize: 13, lineHeight: 20, color: THEME.textMuted }}>
              Significant structural deterioration or failure is visible and restoration attention is urgent.
            </Text>
          </HeritageCard>
        </View>
      </View>

      <View>
        <SectionTitle>Dataset</SectionTitle>
        <Text style={{ fontSize: 13, lineHeight: 22, color: THEME.textMuted }}>
          The training data combines curated heritage site photographs, publicly available imagery, and manually
          annotated examples prepared for supervised classification and explanation studies.
        </Text>
      </View>

      <View>
        <SectionTitle>Team</SectionTitle>
        <View style={{ gap: SPACING.element }}>
          <TeamCard name="Sushma Acharya" id="03" role="Dataset Collection & Curation" />
          <TeamCard name="Aayusha Jaspau" id="23" role="Annotation & Preprocessing" />
          <TeamCard name="Aditya Shrestha" id="57" role="Model Design & Training" />
          <TeamCard name="Akash Kafle" id="27" role="Evaluation & Analysis" />
        </View>
      </View>
    </ScrollView>
  );
}
