import { Sun, Moon, Flower, Bell, Umbrella, Gem, Crown, Landmark, Feather, TreePine } from 'lucide-react';

const icons = [
  { Icon: Sun, style: { top: '8%', left: '12%', width: 28, height: 28, color: 'rgba(212, 160, 74, 0.08)' } },
  { Icon: Moon, style: { top: '15%', right: '18%', width: 24, height: 24, color: 'rgba(212, 160, 74, 0.07)' } },
  { Icon: Flower, style: { top: '40%', left: '8%', width: 22, height: 22, color: 'rgba(166, 58, 42, 0.06)' } },
  { Icon: Bell, style: { top: '55%', right: '12%', width: 20, height: 20, color: 'rgba(166, 58, 42, 0.07)' } },
  { Icon: Umbrella, style: { top: '70%', left: '15%', width: 26, height: 26, color: 'rgba(166, 58, 42, 0.06)' } },
  { Icon: Gem, style: { top: '25%', left: '85%', width: 18, height: 18, color: 'rgba(212, 160, 74, 0.08)' } },
  { Icon: Crown, style: { top: '85%', right: '22%', width: 22, height: 22, color: 'rgba(212, 160, 74, 0.06)' } },
  { Icon: Landmark, style: { top: '50%', left: '88%', width: 24, height: 24, color: 'rgba(166, 58, 42, 0.06)' } },
  { Icon: Feather, style: { top: '10%', left: '40%', width: 20, height: 20, color: 'rgba(166, 58, 42, 0.05)' } },
  { Icon: TreePine, style: { top: '78%', left: '80%', width: 24, height: 24, color: 'rgba(166, 58, 42, 0.06)' } },
];

export default function HeritageScatter() {
  return (
    <>
      {icons.map(({ Icon, style }) => (
        <Icon
          key={style.top + style.left}
          className="bg-scatter-icon"
          style={style}
          strokeWidth={1.2}
        />
      ))}
    </>
  );
}
