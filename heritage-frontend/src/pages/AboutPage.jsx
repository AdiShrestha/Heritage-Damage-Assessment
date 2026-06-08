import { User } from 'lucide-react';
import { DamageLabel } from '../components/assessment/DamageLabel';

function FeatureCard({ title, description }) {
  return (
    <div className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
      <h3 className="text-base font-semibold tracking-tight text-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
    </div>
  );
}

function TeamCard({ name, id, role }) {
  return (
    <div className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-pale text-primary">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-text">{name}</h3>
          <p className="text-sm text-text-muted">{id}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-text-muted">{role}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-stone-custom-light bg-white p-6 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Kathmandu University · COMP 488</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text">Cultural Heritage Damage Assessment</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-text-muted">
          An AI-assisted web system for quickly classifying damage levels in images of heritage structures and showing
          where the model focused using Grad-CAM heatmaps.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-text">The Problem</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-text-muted">
          Heritage structures in Nepal are exposed to earthquakes, weathering, pollution, and age-related decay.
          Manual inspection is slow and resource-intensive, especially for UNESCO sites and remote monuments. A fast
          screening tool helps prioritize field visits and restoration work.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-text">Our Approach</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title="Deep Learning"
            description="Transfer learning with CNN and transformer backbones such as ResNet50, EfficientNet, and ViT."
          />
          <FeatureCard
            title="Grad-CAM"
            description="Explainability overlays highlight structural regions most influential to the damage prediction."
          />
          <FeatureCard
            title="Web Interface"
            description="Upload an image and receive an instant assessment with confidence scores and visual evidence."
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-text">Damage Classes</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
            <DamageLabel label="Undamaged" confidence={1} size="md" />
            <p className="mt-4 text-sm leading-6 text-text-muted">
              The structure appears intact with no visible major deterioration requiring immediate intervention.
            </p>
          </div>
          <div className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
            <DamageLabel label="Partial Damage" confidence={1} size="md" />
            <p className="mt-4 text-sm leading-6 text-text-muted">
              Localized cracking, erosion, or surface damage is present, but the structure remains largely stable.
            </p>
          </div>
          <div className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
            <DamageLabel label="Damaged" confidence={1} size="md" />
            <p className="mt-4 text-sm leading-6 text-text-muted">
              Significant structural deterioration or failure is visible and restoration attention is urgent.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-text">Dataset</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-text-muted">
          The training data combines curated heritage site photographs, publicly available imagery, and manually
          annotated examples prepared for supervised classification and explanation studies.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-text">Team</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <TeamCard name="Sushma Acharya" id="03" role="Dataset Collection & Curation" />
          <TeamCard name="Aayusha Jaspau" id="23" role="Annotation & Preprocessing" />
          <TeamCard name="Aditya Shrestha" id="57" role="Model Design & Training" />
          <TeamCard name="Akash Kafle" id="27" role="Evaluation & Analysis" />
        </div>
      </section>
    </div>
  );
}
