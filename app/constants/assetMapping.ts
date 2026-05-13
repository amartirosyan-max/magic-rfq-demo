import { importAllImages } from "~/utils/imageLoader";

import avatarImage1 from "~/assets/avatars/avatar_connect_to_corporate_knowledge.png";
import avatarImage2 from "~/assets/avatars/avatar_custom_character.png";
import avatarImage3 from "~/assets/avatars/avatar_foundation.png";
import avatarImage4 from "~/assets/avatars/avatar_guardrails.png";
import avatarImage5 from "~/assets/avatars/avatar_hologram.png";
import avatarImage6 from "~/assets/avatars/avatar_person_identification.png";
import avatarImage7 from "~/assets/avatars/avatar_real_human.png";
import avatarImage8 from "~/assets/avatars/avatar_train_speech_lexicons.png";
import avatarImage9 from "~/assets/avatars/avatar_tune_speech_recognition.png";
import avatarImage10 from "~/assets/avatars/avatar_voice_cloning.png";

import hardwareImage1 from "~/assets/hardware/dell-poweredge-760xa.png";
import hardwareImage2 from "~/assets/hardware/Dell-PowerEdge-R660.png";
import hardwareImage3 from "~/assets/hardware/dell-poweredge-xe9680.png";
import hardwareImage4 from "~/assets/hardware/dell-powerscale-f910.png";
import hardwareImage5 from "~/assets/hardware/dell_powerswitch_z9432fon.png";
import hardwareImage6 from "~/assets/hardware/dell_powerswitch_z9664fon.png";
import hardwareImage7 from "~/assets/hardware/nvidia_h200.png";
import hardwareImage8 from "~/assets/hardware/nvidia_l40s.png";
import hardwareImage9 from "~/assets/hardware/ddn_sfa400nvx.png";
import hardwareImage10 from "~/assets/hardware/dell-poweredge-760.png";
import hardwareImage11 from "~/assets/hardware/dell_servers.png";
import hardwareImage12 from "~/assets/hardware/ibm_baw.png";
import hardwareImage13 from "~/assets/hardware/lenovo_servers.png";
import hardwareImage14 from "~/assets/hardware/lenovo_thinksystem_sr780a_v3.png";
import hardwareImage15 from "~/assets/hardware/nvidia_dgx_h200.png";
import hardwareImage16 from "~/assets/hardware/nvidia_servers.png";
import hardwareImage17 from "~/assets/hardware/pure_storage_flashblade_s200.png";
import hardwareImage18 from "~/assets/hardware/resilio_connect.png";
import hardwareImage19 from "~/assets/hardware/tableau_bi.png";
import hardwareImage20 from "~/assets/hardware/nvidia_quantum2_infiniBand.png";
import hardwareImage21 from "~/assets/hardware/nvidia_blueprints.png";
import hardwareImage22 from "~/assets/hardware/nvidia_nims.png";
import hardwareImage23 from "~/assets/hardware/nvidia_rapids.png";
import hardwareImage24 from "~/assets/hardware/nvidia_ace.png";
import hardwareImage25 from "~/assets/hardware/nvidia_nemo.png";
import hardwareImage26 from "~/assets/hardware/nvidia_ai_enterprise_license.png";

import useCaseImage1 from "~/assets/use_cases/use_case_ai_model_calibration_and_improvement.png";
import useCaseImage2 from "~/assets/use_cases/use_case_ai_model_development_and_testing.png";
import useCaseImage3 from "~/assets/use_cases/use_case_customer_support.png";
import useCaseImage4 from "~/assets/use_cases/use_case_data_collection_and_labeling.png";
import useCaseImage5 from "~/assets/use_cases/use_case_deployment_and_integration.png";
import useCaseImage6 from "~/assets/use_cases/use_case_exploratory_data_analysis_and_database_design.png";
import useCaseImage7 from "~/assets/use_cases/use_case_iterative_solution_development.png";
import useCaseImage8 from "~/assets/use_cases/use_case_maintenance_and_repairs.png";
import useCaseImage9 from "~/assets/use_cases/use_case_requirements_analysis.png";
import useCaseImage10 from "~/assets/use_cases/use_case_security_and_compliance_audit.png";
import useCaseImage11 from "~/assets/use_cases/use_case_solution_architecture_design.png";
import useCaseImage12 from "~/assets/use_cases/use_case_user_training_and_documentation.png";

// Isometric
// PowerScale F910_isometric.png
// Dell PowerEdge R660_isometric.png.png
// Dell PowerSwitch Z9432F-ON_isometric.png
// Dell PowerSwitch Z9664F-ON_isometric.png
// Dell R760xa_isometric.png.png
// NVIDIA H200 GPU_isometric.png.png
// NVIDIA L40s GPU_isometric.png
import PowerScaleF910Isometric from "~/assets/isometric/PowerScale F910_isometric.png";
import DellPowerEdgeR660Isometric from "~/assets/isometric/Dell PowerEdge R660_isometric.png";
import DellPowerSwitchZ9432FONIsometric from "~/assets/isometric/Dell PowerSwitch Z9432F-ON_isometric.png";
import DellPowerSwitchZ9664FONIsometric from "~/assets/isometric/Dell PowerSwitch Z9664F-ON_isometric.png";
import DellR760xaIsometric from "~/assets/isometric/Dell R760xa_isometric.png";
import NVIDIAH200GPUIsometric from "~/assets/isometric/NVIDIA H200 GPU_isometric.png";
import NVLD40sGPUIsometric from "~/assets/isometric/NVIDIA L40s GPU_isometric.png";
import HPEProLiantDL385Gen11Isometric from "~/assets/isometric/HPE ProLiant DL385 Gen11_isometric.png";

export const avatarMapNameToImage: Record<string, string> = {
  "Connect to Corporate Knowledge Base": avatarImage1,
  "Cartoon Style 3D Character": avatarImage2,
  "Avatar Foundation": avatarImage3,
  Guardrails: avatarImage4,
  "Hologram Module": avatarImage5,
  "Person Identification (FaceID)": avatarImage6,
  "Copy of a Real Human": avatarImage7,
  "Domain-specific Lexicons": avatarImage8,
  "Noisy Environment Filter": avatarImage9,
  "Voice Cloning": avatarImage10,
};

export const hardwareMapNameToImage: Record<string, string> = {
  "Dell PowerEdge R760xa": hardwareImage1,
  "Dell PowerEdge R660": hardwareImage2,
  "Dell PowerEdge XE9680": hardwareImage3,
  "Dell PowerScale F910": hardwareImage4,
  "NVIDIA L40S GPU": hardwareImage8,
  "NVIDIA H200 GPU": hardwareImage7,
  "Dell PowerSwitch Z9664F-ON": hardwareImage6,
  "Dell PowerSwitch Z9432F-ON": hardwareImage5,
  "Dell PowerEdge R760": hardwareImage10,
  "NVIDIA DGX H200": hardwareImage15,
  "Lenovo ThinkSystem SR780a V3": hardwareImage14,
  "DDN SFA400NVX": hardwareImage9,
  "PureStorage FlashBlade//S200": hardwareImage17,
  "Dell Data Center Products": hardwareImage11,
  "NVIDIA Data Center Products": hardwareImage16,
  "Lenovo Data Center Products": hardwareImage13,
  "Tableau BI": hardwareImage19,
  "IBM Business Automation Workflow ": hardwareImage12,
  "Resilio Connect": hardwareImage18,
  "NVIDIA Quantum-2 InfiniBand QM9700": hardwareImage20,

  "LLM Router Blueprint": hardwareImage21,
  "Build an Enterprise RAG pipeline Blueprint": hardwareImage21,
  "Traceability for Agentic AI Blueprint": hardwareImage21,
  "Voice Agent Framework for Conversational AI Blueprint": hardwareImage21,
  "Document Research Assistant for Blog Creation Blueprint": hardwareImage21,
  "Structured Report Generation Blueprint": hardwareImage21,
  "Build a Digital Human Blueprint": hardwareImage21,
  "Vulnerability Analysis for Container Security Blueprint": hardwareImage21,
  "Build an AI Virtual Assistant Blueprint": hardwareImage21,
  "3D Conditioning for Precise Visual Generative AI Blueprint": hardwareImage21,
  "Build a Video Search and Summarization (VSS) Agent Blueprint":
    hardwareImage21,

  "Audio2Face-2D NIM": hardwareImage22,
  "Audio2Face-3D NIM": hardwareImage22,
  "Cosmos-Predict1-7B-Video2World NIM": hardwareImage22,
  "Studio Voice NIM": hardwareImage22,
  "Parakeet 0.6b CTC en-US NIM": hardwareImage22,
  "Riva NMT NIM": hardwareImage22,
  "Riva ASR NIM": hardwareImage22,
  "Riva TTS NIM": hardwareImage22,
  "Magpie TTS Multilingual NIM": hardwareImage22,
  "NV-CLIP NIM": hardwareImage22,
  "DeepSeek-R1-Distill-Llama-70B NIM": hardwareImage22,
  "DeepSeek-R1-Distill-Qwen-7B NIM": hardwareImage22,
  "Llama-3.1-70B-Instruct NIM": hardwareImage22,
  "Llama 3-8B Instruct NIM": hardwareImage22,
  "NVIDIA Retrieval QA E5 Embedding v5 NIM": hardwareImage22,
  "NVIDIA Retrieval QA Llama 3.2 1B Reranking v2 NIM": hardwareImage22,
  "NeMo Retriever Page Elements v2 NIM": hardwareImage22,
  "NeMo Retriever Table Structure v1 NIM": hardwareImage22,
  "MAISI NIM": hardwareImage22,
  "VISTA-3D NIM": hardwareImage22,
  MolMIM: hardwareImage22,
  "AlphaFold2 NIM": hardwareImage22,

  "NVIDIA RAPIDS": hardwareImage23,
  "NVIDIA ACE (Avatar Cloud Engine)": hardwareImage24,
  "NVIDIA NeMo": hardwareImage25,
  "NVIDIA AI Enterprise License": hardwareImage26,

  "Business and Requirements Analysis": useCaseImage9,
  "Exploratory Data Analysis and Database Design": useCaseImage6,
  "Solution Architecture Design": useCaseImage11,
  "Iterative Solution Development": useCaseImage7,
  "AI Model Development and Testing": useCaseImage2,
  "Data Collection and Labeling": useCaseImage4,
  "Deployment & Integration": useCaseImage5,
  "User Training and Documentation": useCaseImage12,
  "Customer Support and Monitoring": useCaseImage3,
  "Maintenance and Repairs of Physical Equipment": useCaseImage8,
  "Continuous AI Model Calibration and Improvement": useCaseImage1,
  "Security and Compliance Audit": useCaseImage10,
};

export let hrUidToImageMap: Record<string, string> = {};
export const loadAllImages = async () => {
  // Import all images from different directories
  const avatarImages = await importAllImages("avatars");
  const hardwareImages = await importAllImages("hardware");
  const useCaseImages = await importAllImages("use_cases");
  const productIcons = await importAllImages("product_icons");

  // Combine all images into one map
  hrUidToImageMap = {
    ...avatarImages,
    ...hardwareImages,
    ...useCaseImages,
    ...productIcons,
  };
};

export const isometricImageMap: Record<string, string> = {
  dell_poweredge_xe9680: PowerScaleF910Isometric,
  dell_poweredge_r660: DellPowerEdgeR660Isometric,
  "dell_powerswitch_z9432f-on": DellPowerSwitchZ9432FONIsometric,
  "dell_powerswitch_z9664f-on": DellPowerSwitchZ9664FONIsometric,
  dellpoweredge_r760xa: DellR760xaIsometric,
  nvidia_h200_gpu: NVIDIAH200GPUIsometric,
  nvidia_l40s_gpu: NVLD40sGPUIsometric,
  hpe_proliant_dl385_gen11: HPEProLiantDL385Gen11Isometric,
};

//// NVIDIA L40s GPU_isometric  —> $ 8627
// // NVIDIA H200 GPU_isometric  —> $ 30000
// // PowerScale F910_isometric  —> $ 210000
// // Dell R760xa_isometric  —> $ 20170
// // Dell PowerEdge R660_isometric  —> $ 6400
// // Dell PowerSwitch Z9432F-ON_isometric  —> $ 12030
// // Dell PowerSwitch Z9664F-ON_isometric  —> $ 8495
export const isometricImagePrices: Record<string, number> = {
  dell_poweredge_xe9680: 252000,
  dell_poweredge_r660: 6400,
  "dell_powerswitch_z9432f-on": 12030,
  "dell_powerswitch_z9664f-on": 8495,
  dellpoweredge_r760xa: 20170,
  nvidia_h200_gpu: 30000,
  nvidia_l40s_gpu: 8627,
  hpe_proliant_dl385_gen11: 100000,
};
