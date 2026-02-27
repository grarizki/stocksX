export type NewsArticle = {
	id: string;
	title: string;
	summary: string;
	source: string;
	category: "market" | "stocks" | "economy" | "education";
	date: string;
	imageUrl: string;
	relatedTickers: string[];
};

export const newsArticles: NewsArticle[] = [
	{
		id: "news-1",
		title:
			"IHSG Ditutup Menguat di Tengah Arus Beli Asing pada Saham Perbankan",
		summary:
			"Indeks Harga Saham Gabungan (IHSG) ditutup menguat 0,45% ke level 7.285 pada perdagangan Jumat. Saham-saham perbankan besar menjadi penopang utama kenaikan indeks.",
		source: "CNBC Indonesia",
		category: "market",
		date: "2026-02-14T15:30:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
		relatedTickers: ["BBCA", "BMRI", "BBRI", "BBNI"],
	},
	{
		id: "news-2",
		title:
			"ADRO Cetak Laba Bersih Rp 18,2 Triliun di 2025, Melampaui Ekspektasi",
		summary:
			"Adaro Energy Indonesia membukukan laba bersih Rp 18,2 triliun sepanjang tahun 2025, naik 12% dibandingkan tahun sebelumnya. Kinerja ini melampaui konsensus analis.",
		source: "Bisnis.com",
		category: "stocks",
		date: "2026-02-13T10:15:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&q=80",
		relatedTickers: ["ADRO", "PTBA", "ITMG"],
	},
	{
		id: "news-3",
		title:
			"Bank Indonesia Pertahankan Suku Bunga di 5,75%, Sinyal Pemangkasan di Maret",
		summary:
			"Bank Indonesia memutuskan untuk mempertahankan BI Rate di level 5,75% pada Rapat Dewan Gubernur Februari 2026. Namun, gubernur BI memberikan sinyal kuat pemangkasan pada pertemuan berikutnya.",
		source: "Kontan",
		category: "economy",
		date: "2026-02-12T14:00:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
		relatedTickers: ["BBCA", "BBRI", "BMRI", "BBNI"],
	},
	{
		id: "news-4",
		title: "Saham ANTM dan MDKA Melesat Ditopang Kenaikan Harga Emas Global",
		summary:
			"Saham-saham emiten tambang emas mengalami penguatan signifikan seiring kenaikan harga emas dunia yang menyentuh rekor baru di level USD 2.180 per troy ounce.",
		source: "IDX Channel",
		category: "stocks",
		date: "2026-02-12T11:45:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1624365169364-0640dd10e180?w=800&q=80",
		relatedTickers: ["ANTM", "MDKA"],
	},
	{
		id: "news-5",
		title: "Inflasi Januari 2026 Terkendali di 2,68%, Terendah dalam 3 Bulan",
		summary:
			"Badan Pusat Statistik melaporkan inflasi Januari 2026 sebesar 2,68% year-on-year, turun dari 2,81% di bulan sebelumnya. Komponen bahan pangan menjadi penyumbang utama inflasi.",
		source: "CNBC Indonesia",
		category: "economy",
		date: "2026-02-10T09:00:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80",
		relatedTickers: [],
	},
	{
		id: "news-6",
		title: "BBRI Targetkan Pertumbuhan Kredit 10-12% di 2026, Fokus UMKM",
		summary:
			"Bank Rakyat Indonesia menargetkan pertumbuhan kredit sebesar 10-12% pada 2026, didorong oleh segmen UMKM dan KUR. Manajemen optimis kualitas aset tetap terjaga.",
		source: "Bisnis.com",
		category: "stocks",
		date: "2026-02-11T08:30:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
		relatedTickers: ["BBRI"],
	},
	{
		id: "news-7",
		title:
			"Rupiah Stabil di Rp 15.830, Cadangan Devisa Naik ke USD 139,5 Miliar",
		summary:
			"Nilai tukar rupiah terhadap dolar AS stabil di kisaran Rp 15.830. Bank Indonesia melaporkan cadangan devisa naik ke USD 139,5 miliar pada akhir Januari 2026.",
		source: "Kontan",
		category: "economy",
		date: "2026-02-11T12:00:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&q=80",
		relatedTickers: [],
	},
	{
		id: "news-8",
		title: "TLKM Umumkan Rencana Spin-Off Bisnis Data Center, Saham Naik 2%",
		summary:
			"Telkom Indonesia mengumumkan rencana spin-off unit bisnis data center menjadi entitas terpisah. Langkah ini bertujuan untuk mengoptimalkan valuasi aset digital perusahaan.",
		source: "CNBC Indonesia",
		category: "stocks",
		date: "2026-02-10T13:20:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
		relatedTickers: ["TLKM", "TOWR"],
	},
	{
		id: "news-9",
		title:
			"Investor Asing Catat Net Sell Rp 2,3 Triliun di Februari, Sektor Konsumer Paling Dilepas",
		summary:
			"Investor asing tercatat melakukan net sell sebesar Rp 2,3 triliun di pasar saham Indonesia sepanjang Februari 2026. Saham-saham sektor konsumer menjadi yang paling banyak dilepas.",
		source: "IDX Channel",
		category: "market",
		date: "2026-02-14T16:00:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=800&q=80",
		relatedTickers: ["UNVR", "ICBP", "HMSP", "ADRO", "ANTM", "MDKA"],
	},
	{
		id: "news-10",
		title: "EMTK Akuisisi Platform Fintech, Perkuat Ekosistem Digital",
		summary:
			"Elang Mahkota Teknologi mengakuisisi 65% saham platform fintech lending dengan nilai transaksi Rp 1,2 triliun. Langkah ini memperkuat ekosistem digital EMTK.",
		source: "Bisnis.com",
		category: "stocks",
		date: "2026-02-09T10:00:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
		relatedTickers: ["EMTK"],
	},
	{
		id: "news-11",
		title: "Panduan Pemula: Memahami Rasio P/E dan PBV dalam Investasi Saham",
		summary:
			"Memahami rasio Price-to-Earnings (P/E) dan Price-to-Book Value (PBV) sangat penting bagi investor saham. Kedua rasio ini membantu menilai apakah suatu saham overvalued atau undervalued.",
		source: "IDX Channel",
		category: "education",
		date: "2026-02-08T07:00:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&q=80",
		relatedTickers: ["BBCA", "BBNI"],
	},
	{
		id: "news-12",
		title:
			"Neraca Perdagangan Januari Surplus USD 3,56 Miliar, Ekspor CPO Melonjak",
		summary:
			"Indonesia mencatat surplus neraca perdagangan sebesar USD 3,56 miliar pada Januari 2026, ditopang oleh ekspor komoditas yang kuat terutama minyak kelapa sawit.",
		source: "Kontan",
		category: "economy",
		date: "2026-02-07T09:30:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
		relatedTickers: ["AALI", "LSIP", "CPIN"],
	},
	{
		id: "news-13",
		title:
			"ICBP Ekspansi Pabrik Indomie di Afrika, Targetkan Kapasitas 2x Lipat",
		summary:
			"Indofood CBP berencana menggandakan kapasitas produksi pabrik Indomie di Nigeria dan Kenya. Ekspansi ini merespons pertumbuhan permintaan mi instan yang kuat di benua Afrika.",
		source: "CNBC Indonesia",
		category: "stocks",
		date: "2026-02-06T11:00:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
		relatedTickers: ["ICBP", "INDF"],
	},
	{
		id: "news-14",
		title:
			"Mengenal Strategi Dollar Cost Averaging untuk Investasi Saham Jangka Panjang",
		summary:
			"Dollar Cost Averaging (DCA) adalah strategi investasi yang cocok untuk investor jangka panjang. Dengan investasi rutin, investor dapat mengurangi risiko timing market.",
		source: "Bisnis.com",
		category: "education",
		date: "2026-02-05T07:30:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1638913662252-70efce1e60a7?w=800&q=80",
		relatedTickers: ["BBCA", "BBRI", "TLKM"],
	},
	{
		id: "news-15",
		title:
			"Sektor Energi Memimpin Kenaikan IHSG, Harga Batu Bara Kembali Menguat",
		summary:
			"Sektor energi menjadi penopang utama kenaikan IHSG dengan penguatan 1,25%. Harga batu bara acuan Newcastle naik 3% ke level USD 135 per ton.",
		source: "IDX Channel",
		category: "market",
		date: "2026-02-13T15:45:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1581087461574-bef5a2e4f476?w=800&q=80",
		relatedTickers: ["ADRO", "PTBA", "PGAS"],
	},
	{
		id: "news-16",
		title:
			"BRIS Catat Pertumbuhan Pembiayaan 18% di 2025, Tertinggi di Industri Perbankan",
		summary:
			"Bank Syariah Indonesia mencatat pertumbuhan pembiayaan 18% year-on-year pada 2025, menjadikannya bank dengan pertumbuhan tertinggi di industri perbankan nasional.",
		source: "Kontan",
		category: "stocks",
		date: "2026-02-08T10:30:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80",
		relatedTickers: ["BRIS"],
	},
	{
		id: "news-17",
		title:
			"GDP Indonesia Tumbuh 5,05% di Q4 2025, Konsumsi Rumah Tangga Jadi Penopang",
		summary:
			"Ekonomi Indonesia tumbuh 5,05% year-on-year di kuartal IV 2025, melambat dari 5,11% di kuartal sebelumnya. Konsumsi rumah tangga tetap menjadi penopang utama pertumbuhan.",
		source: "CNBC Indonesia",
		category: "economy",
		date: "2026-02-05T09:00:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80",
		relatedTickers: [],
	},
];
