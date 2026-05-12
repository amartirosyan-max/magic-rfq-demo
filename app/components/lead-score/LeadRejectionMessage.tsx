import { useNavigate } from "react-router";
import { Button } from "../ui/button";

const LeadRejectionMessage = () => {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg">
      <div className="border border-[rgba(94,82,64,0.15)] rounded-lg p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-2xl leading-none">👋</div>
          <div>
            <h1 className="m-0 text-[18px] font-semibold font-[Roboto_Serif] text-[#3a3540]">
              Thanks for your request!
            </h1>
          </div>
        </div>

        <p className="m-0 mb-6 text-sm leading-[1.6] text-black/70">
          We appreciate your interest. Right now, we're optimized specifically
          for AI-focused requests. Your request doesn't quite fit our current
          offering, but we have great alternatives.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-start gap-4 p-4 bg-[rgba(33,128,141,0.05)] border border-[rgba(33,128,141,0.1)] rounded-lg transition">
            <div className="text-lg mt-0.5">⚙️</div>
            <div>
              <h3 className="m-0 mb-1 text-[13px] font-semibold text-[#3a3540]">
                AI Enterprise Solution
              </h3>
              <p className="m-0 text-xs leading-[1.5] text-black/70">
                Custom AI workflows tailored to your specific needs
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-[rgba(33,128,141,0.05)] border border-[rgba(33,128,141,0.1)] rounded-lg transition">
            <div className="text-lg mt-0.5">📚</div>
            <div>
              <h3 className="m-0 mb-1 text-[13px] font-semibold text-[#3a3540]">
                AI Use Cases Library
              </h3>
              <p className="m-0 text-xs leading-[1.5] text-black/70">
                Explore what we support and find a solution that works
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-[rgba(33,128,141,0.05)] border border-[rgba(33,128,141,0.1)] rounded-lg transition">
            <div className="text-lg mt-0.5">💬</div>
            <div>
              <h3 className="m-0 mb-1 text-[13px] font-semibold text-[#3a3540]">
                Talk to Our Team
              </h3>
              <p className="m-0 text-xs leading-[1.5] text-black/70">
                Let's discuss your needs – we might have a better path
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            className="justify-center"
            onClick={() => navigate("/dashboard")}
          >
            Create another project
          </Button>
        </div>
        {/* <div className="text-center text-xs text-black/60 border-t border-[rgba(94,82,64,0.15)] pt-4 mt-6">
          Still interested?{" "}
          <Link
            to="/dashboard"
            className="text-[#21808d] font-medium hover:underline"
          >
            Get in touch
          </Link>{" "}
          – we're here to help.
        </div> */}
      </div>
    </div>
  );
};

export default LeadRejectionMessage;
