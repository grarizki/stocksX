const DUMMY_NEWS = [
	{
		id: "news-1",
		title: "IHSG Menguat 0.6% Didorong Saham Perbankan dan Energi",
		summary:
			"Indeks Harga Saham Gabungan (IHSG) menguat 0,60% ke level 7.125 pada perdagangan Senin, didorong kenaikan saham perbankan besar seperti BBCA, BMRI, dan BBNI.",
		source: "Bisnis.com",
		url: "https://market.bisnis.com",
		date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["BBCA.JK", "BMRI.JK", "BBNI.JK"],
		category: "market",
	},
	{
		id: "news-2",
		title: "Bank Indonesia Pertahankan Suku Bunga Acuan di Level 6%",
		summary:
			"Rapat Dewan Gubernur Bank Indonesia memutuskan mempertahankan suku bunga acuan BI-Rate di level 6,00% untuk menjaga stabilitas rupiah dan mengendalikan inflasi.",
		source: "Kontan.co.id",
		url: "https://investasi.kontan.co.id",
		date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: [],
		category: "macro",
	},
	{
		id: "news-3",
		title: "Bayan Resources (BYAN) Catat Laba Bersih Rp 18 Triliun di 2025",
		summary:
			"PT Bayan Resources Tbk (BYAN) membukukan laba bersih Rp 18 triliun sepanjang 2025, turun dari tahun sebelumnya akibat normalisasi harga batu bara global.",
		source: "CNBC Indonesia",
		url: "https://www.cnbcindonesia.com",
		date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["BYAN.JK"],
		category: "earnings",
	},
	{
		id: "news-4",
		title: "GoTo (GOTO) Umumkan Ekspansi Layanan GoPay ke Luar Negeri",
		summary:
			"PT GoTo Gojek Tokopedia Tbk mengumumkan rencana ekspansi layanan pembayaran digital GoPay ke pasar Asia Tenggara mulai kuartal II 2026.",
		source: "Tempo.co",
		url: "https://bisnis.tempo.co",
		date: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["GOTO.JK"],
		category: "corporate",
	},
	{
		id: "news-5",
		title:
			"Telkom Indonesia (TLKM) Targetkan Pertumbuhan Pendapatan 8% di 2026",
		summary:
			"PT Telkom Indonesia Tbk menetapkan target pertumbuhan pendapatan sebesar 8% pada 2026, didorong oleh segmen data center dan layanan cloud enterprise.",
		source: "Investor.id",
		url: "https://investor.id",
		date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["TLKM.JK"],
		category: "corporate",
	},
	{
		id: "news-6",
		title:
			"Sektor Energi Pimpin Penguatan Bursa Asia di Tengah Kenaikan Harga Minyak",
		summary:
			"Saham-saham sektor energi memimpin penguatan bursa Asia setelah harga minyak mentah Brent kembali ke atas USD 82 per barel menyusul ketegangan geopolitik di Timur Tengah.",
		source: "Reuters",
		url: "https://www.reuters.com",
		date: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["BYAN.JK", "ADRO.JK", "PTBA.JK"],
		category: "market",
	},
	{
		id: "news-7",
		title:
			"BCA (BBCA) Salurkan Kredit Rp 980 Triliun, Tumbuh 12% Secara Tahunan",
		summary:
			"PT Bank Central Asia Tbk mencatat total penyaluran kredit Rp 980 triliun per akhir 2025, tumbuh 12% year-on-year, didukung segmen korporasi dan UMKM.",
		source: "Detik Finance",
		url: "https://finance.detik.com",
		date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["BBCA.JK"],
		category: "earnings",
	},
	{
		id: "news-8",
		title:
			"Astra International (ASII) Perluas Bisnis Kendaraan Listrik dengan EV Hub Nasional",
		summary:
			"PT Astra International Tbk mengumumkan pembangunan EV Hub nasional pertama di Karawang untuk mendukung ekosistem kendaraan listrik di Indonesia.",
		source: "Katadata.co.id",
		url: "https://katadata.co.id",
		date: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["ASII.JK"],
		category: "corporate",
	},
	{
		id: "news-9",
		title: "Rupiah Menguat ke Rp 15.850 per Dolar AS Jelang Data Inflasi AS",
		summary:
			"Nilai tukar rupiah menguat 0,35% ke level Rp 15.850 per dolar AS pada perdagangan pagi ini, didorong sentimen positif menjelang rilis data inflasi Amerika Serikat.",
		source: "Bloomberg",
		url: "https://www.bloomberg.com",
		date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: [],
		category: "macro",
	},
	{
		id: "news-10",
		title:
			"Kalbe Farma (KLBF) Luncurkan Produk Bioteknologi Pertama Buatan Dalam Negeri",
		summary:
			"PT Kalbe Farma Tbk resmi meluncurkan produk bioteknologi pertama buatan Indonesia, sebuah biosimilar untuk terapi kanker yang dikembangkan bersama mitra dari Korea.",
		source: "Republika.co.id",
		url: "https://www.republika.co.id",
		date: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["KLBF.JK"],
		category: "corporate",
	},
	{
		id: "news-11",
		title:
			"Bukit Asam (PTBA) Raih Kontrak Ekspor Batu Bara Rp 12 Triliun ke India",
		summary:
			"PT Bukit Asam Tbk berhasil mendapatkan kontrak ekspor batu bara senilai Rp 12 triliun dengan perusahaan energi India untuk periode 2026–2028.",
		source: "Bisnis.com",
		url: "https://market.bisnis.com",
		date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["PTBA.JK"],
		category: "corporate",
	},
	{
		id: "news-12",
		title: "OJK Dorong Literasi Pasar Modal di Kalangan Milenial dan Gen Z",
		summary:
			"Otoritas Jasa Keuangan (OJK) meluncurkan program literasi pasar modal baru yang menyasar kalangan milenial dan Gen Z melalui platform digital dan media sosial.",
		source: "Kompas.com",
		url: "https://money.kompas.com",
		date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: [],
		category: "regulation",
	},
	{
		id: "news-13",
		title:
			"BRI (BBRI) Perkuat Layanan Digital Banking dengan Akuisisi Fintech Lokal",
		summary:
			"PT Bank Rakyat Indonesia Tbk mengumumkan akuisisi startup fintech lokal senilai Rp 800 miliar untuk memperkuat ekosistem layanan keuangan digital BRImo.",
		source: "CNBC Indonesia",
		url: "https://www.cnbcindonesia.com",
		date: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["BBRI.JK"],
		category: "corporate",
	},
	{
		id: "news-14",
		title: "Indofood CBP (ICBP) Ekspansi Pasar ke Afrika dengan Produk Indomie",
		summary:
			"PT Indofood CBP Sukses Makmur Tbk memperluas pasar ekspor Indomie ke 5 negara Afrika baru, menargetkan pendapatan ekspor tumbuh 25% pada 2026.",
		source: "Tempo.co",
		url: "https://bisnis.tempo.co",
		date: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["ICBP.JK"],
		category: "corporate",
	},
	{
		id: "news-15",
		title:
			"Summarecon (SMRA) Luncurkan Kavling di Bekasi dengan Harga Mulai Rp 1,5 Miliar",
		summary:
			"PT Summarecon Agung Tbk meluncurkan produk kavling residensial terbaru di kawasan Bekasi dengan harga mulai Rp 1,5 miliar, mendapat respons antusias dari pasar.",
		source: "Properti.kompas.com",
		url: "https://properti.kompas.com",
		date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		relatedTickers: ["SMRA.JK"],
		category: "corporate",
	},
];

export default defineEventHandler((event) => {
	const query = getQuery(event);
	const limit = Number(query.limit ?? 20);

	return DUMMY_NEWS.slice(0, limit);
});
