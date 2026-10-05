interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">{title}</h1>
        <p className="text-slate-400">{subtitle}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}


