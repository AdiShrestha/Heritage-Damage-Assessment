import { User } from "lucide-react";
import { DamageLabel } from "../components/assessment/DamageLabel";

function FeatureCard({ title, description }) {
  return (
    <div className="scan-card p-5 transition duration-300 hover:-translate-y-1">
      <h3 className="font-display text-base font-semibold tracking-tight text-[#251c19]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#796a62]">{description}</p>
    </div>
  );
}

function TeamCard({ name, id, role }) {
  return (
    <div className="scan-card p-5 transition duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7EDE8] text-[#A63A2A] ring-1 ring-[#E8D5C4]">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-[#251c19]">{name}</h3>
          <p className="text-sm text-[#796a62]">{id}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-[#796a62]">{role}</p>
    </div>
  );
}

function PagodaOrnament() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="text-[#A63A2A]"
    >
      <rect
        x="8"
        y="24"
        width="48"
        height="36"
        rx="2"
        fill="currentColor"
        opacity="0.85"
      />
      <rect
        x="14"
        y="14"
        width="36"
        height="12"
        rx="2"
        fill="currentColor"
        opacity="0.7"
      />
      <rect
        x="20"
        y="6"
        width="24"
        height="10"
        rx="2"
        fill="currentColor"
        opacity="0.55"
      />
      <rect
        x="22"
        y="32"
        width="20"
        height="20"
        rx="1"
        fill="rgba(255,255,255,0.2)"
      />
      <path d="M32 34l5 10H27z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="dashboard-shell space-y-10 p-4 sm:p-6">
      <section className="window-card p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-1">
            <PagodaOrnament />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4A04A]">
              {/* Kathmandu University · COMP 488 */}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#251c19]">
              Cultural Heritage Damage Assessment
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#796a62]">
              An AI-assisted web system for quickly classifying damage levels in
              images of heritage structures and showing where the model focused
              using Grad-CAM heatmaps.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight text-[#251c19]">
          <span className="heritage-ornament">The Problem</span>
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-[#796a62]">
          Heritage structures in Nepal are exposed to earthquakes, weathering,
          pollution, and age-related decay. Manual inspection is slow and
          resource-intensive, especially for UNESCO sites and remote monuments.
          A fast screening tool helps prioritize field visits and restoration
          work.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight text-[#251c19]">
          <span className="heritage-ornament">Our Approach</span>
        </h2>
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
        <h2 className="font-display text-xl font-semibold tracking-tight text-[#251c19]">
          <span className="heritage-ornament">Damage Classes</span>
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <div className="scan-card p-5">
            <DamageLabel label="Undamaged" confidence={1} size="md" />
            <p className="mt-4 text-sm leading-6 text-[#796a62]">
              The structure appears intact with no visible major deterioration
              requiring immediate intervention.
            </p>
          </div>
          <div className="scan-card p-5">
            <DamageLabel label="Partial Damage" confidence={1} size="md" />
            <p className="mt-4 text-sm leading-6 text-[#796a62]">
              Localized cracking, erosion, or surface damage is present, but the
              structure remains largely stable.
            </p>
          </div>
          <div className="scan-card p-5">
            <DamageLabel label="Damaged" confidence={1} size="md" />
            <p className="mt-4 text-sm leading-6 text-[#796a62]">
              Significant structural deterioration or failure is visible and
              restoration attention is urgent.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight text-[#251c19]">
          <span className="heritage-ornament">Dataset</span>
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-[#796a62]">
          The training data combines curated heritage site photographs, publicly
          available imagery, and manually annotated examples prepared for
          supervised classification and explanation studies.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight text-[#251c19]">
          <span className="heritage-ornament">Team</span>
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <TeamCard
            name="Sushma Acharya"
            id="03"
            role="Dataset Collection & Curation"
          />
          <TeamCard
            name="Aayusha Jaspau"
            id="23"
            role="Annotation & Preprocessing"
          />
          <TeamCard
            name="Aditya Shrestha"
            id="57"
            role="Model Design & Training"
          />
          <TeamCard name="Akash Kafle" id="27" role="Evaluation & Analysis" />
        </div>
      </section>
    </div>
  );
}
