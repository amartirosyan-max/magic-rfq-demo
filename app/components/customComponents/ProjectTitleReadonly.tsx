interface ProjectTitleReadonlyProps {
  title: string;
  description?: string | null;
}

const ProjectTitleReadonly = ({
  title,
  description,
}: ProjectTitleReadonlyProps) => {
  return (
    <div className="flex gap-6 text-black justify-between">
      <div className="flex flex-col gap-1 w-full">
        <h1 className="text-3xl font-bold font-[Roboto_Serif] text-[#3a3540]">
          {title}
        </h1>
        {description && (
          <p className="text-base leading-[150%]">{description}</p>
        )}
      </div>
    </div>
  );
};

export default ProjectTitleReadonly;
