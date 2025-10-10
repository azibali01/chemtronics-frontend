import React from "react";
import { Switch, Group, Text } from "@mantine/core";
import { useBrand } from "../Dashboard/Context/BrandContext";

const BrandToggle: React.FC = () => {
  const { brand, setBrand } = useBrand();

  const isHydroworx = brand === "hydroworx";

  const handleToggle = (checked: boolean) => {
    setBrand(checked ? "hydroworx" : "chemtronics");
  };

  return (
    <Group align="center" gap="sm">
      <Text fw={!isHydroworx ? 700 : 400} c={!isHydroworx ? "blue" : "gray"}>
        Chemtronics
      </Text>
      <Switch
        checked={isHydroworx}
        onChange={(event) => handleToggle(event.currentTarget.checked)}
        color="blue"
        size="md"
        thumbIcon={
          isHydroworx ? (
            <span role="img" aria-label="hydro">
              💧
            </span>
          ) : (
            <span role="img" aria-label="chem">
              ⚗️
            </span>
          )
        }
      />
      <Text fw={isHydroworx ? 700 : 400} c={isHydroworx ? "blue" : "gray"}>
        Hydroworx
      </Text>
    </Group>
  );
};

export default BrandToggle;
