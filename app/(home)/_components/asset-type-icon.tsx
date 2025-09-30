import { AssetType } from "@prisma/client";
import { LineChart, Building, Bitcoin } from "lucide-react";
import React from "react";

interface AssetTypeIconProps {
  type: AssetType;
  className?: string;
}

const AssetTypeIcon = ({ type, className }: AssetTypeIconProps) => {
  switch (type) {
    case "ACAO":
      return <LineChart className={className} />;
    case "FII":
      return <Building className={className} />;
    case "CRIPTO":
      return <Bitcoin className={className} />;
    default:
      return null;
  }
};

export default AssetTypeIcon;
