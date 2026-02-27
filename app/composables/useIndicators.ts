import { type EconomicIndicator, indicators } from "~/data/indicators";

export const useIndicators = () => {
	const getIndicators = (): EconomicIndicator[] => {
		return indicators;
	};

	const getIndicatorsByCategory = (category: string): EconomicIndicator[] => {
		return indicators.filter((i) => i.category === category);
	};

	return {
		getIndicators,
		getIndicatorsByCategory,
	};
};
