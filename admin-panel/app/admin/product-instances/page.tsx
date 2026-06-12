"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Plus, Search, Trash2, Download, QrCode, X } from "lucide-react";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

interface Product {
	id: string;
	name: string;
	key: string;
}

interface ProductInstance {
	_id: string;
	product_id: {
		_id: string;
		name: string;
		key: string;
	};
	activation_code: string;
	is_activated: boolean;
	activated_by: {
		_id: string;
		name: string;
		email: string;
	} | null;
	activated_at: string | null;
	created_at: string;
}

export default function ProductInstancesPage() {
	const [instances, setInstances] = useState<ProductInstance[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	// Filter
	const [selectedProductId, setSelectedProductId] = useState<string>("");

	// Generate Modal
	const [showGenerateModal, setShowGenerateModal] = useState(false);
	const [generateForm, setGenerateForm] = useState({
		product_id: "",
		quantity: 10,
		prefix: "THERA",
	});
	const [generating, setGenerating] = useState(false);

	// Hidden dev for QR downloading
	const [downloadData, setDownloadData] = useState<{
		code: string;
		name: string;
	} | null>(null);

	useEffect(() => {
		fetchProducts();
	}, []);

	useEffect(() => {
		fetchInstances();
	}, [selectedProductId]);

	const fetchProducts = async () => {
		try {
			const data = await api.get<Product[]>("/products");
			setProducts(data);
		} catch (error: any) {
			toast.error("Lỗi tải danh sách sản phẩm");
		}
	};

	const fetchInstances = async () => {
		setLoading(true);
		try {
			const endpoint = selectedProductId
				? `/product-instances?product_id=${selectedProductId}`
				: "/product-instances";
			const data = await api.get<ProductInstance[]>(endpoint);
			setInstances(data);
		} catch (error: any) {
			toast.error("Lỗi tải danh sách mã sản phẩm");
		} finally {
			setLoading(false);
		}
	};

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!generateForm.product_id) {
			return toast.error("Vui lòng chọn sản phẩm");
		}

		setGenerating(true);
		try {
			await api.post("/product-instances/generate", generateForm);
			toast.success("Tạo mã thành công");
			setShowGenerateModal(false);
			fetchInstances();
		} catch (error: any) {
			toast.error(error.message || "Lỗi khi tạo mã");
		} finally {
			setGenerating(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!window.confirm("Bạn có chắc chắn muốn xóa mã này?")) return;

		try {
			await api.delete(`/product-instances/${id}`);
			toast.success("Đã xóa mã");
			fetchInstances();
		} catch (error: any) {
			toast.error(error.message || "Lỗi khi xóa");
		}
	};

	const handleToggleStatus = async (id: string, currentStatus: boolean) => {
		try {
			await api.put(`/product-instances/${id}`, {
				is_activated: !currentStatus,
			});
			toast.success("Đã cập nhật trạng thái");
			fetchInstances();
		} catch (error: any) {
			toast.error(error.message || "Lỗi cập nhật");
		}
	};

	const handleDownloadQR = (instance: ProductInstance) => {
		setDownloadData({
			code: instance.activation_code,
			name: instance.product_id.key,
		});

		// Allow React state to update before downloading
		setTimeout(() => {
			const svg = document.getElementById("qr-code-svg");
			if (svg) {
				const svgData = new XMLSerializer().serializeToString(svg);
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				const img = new Image();

				img.onload = () => {
					canvas.width = img.width;
					canvas.height = img.height + 40; // Add space for text
					if (ctx) {
						ctx.fillStyle = "white";
						ctx.fillRect(0, 0, canvas.width, canvas.height);
						ctx.drawImage(img, 0, 0);

						ctx.fillStyle = "black";
						ctx.font = "16px Arial";
						ctx.textAlign = "center";
						ctx.fillText(
							instance.activation_code,
							canvas.width / 2,
							canvas.height - 15,
						);

						const a = document.createElement("a");
						a.download = `QR_${strLimit(instance.product_id.key, 10)}_${instance.activation_code}.png`;
						a.href = canvas.toDataURL("image/png");
						a.click();
					}
				};
				img.src =
					"data:image/svg+xml;base64," +
					btoa(unescape(encodeURIComponent(svgData)));
			}
		}, 150);
	};

	const strLimit = (str: string, len: number) => {
		return str.length > len ? str.substring(0, len) : str;
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center flex-wrap gap-4">
				<h1 className="text-2xl font-bold text-slate-900">Mã Sản Phẩm</h1>
				<button
					onClick={() => setShowGenerateModal(true)}
					className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
				>
					<Plus size={20} />
					<span>Tạo Mã Mới</span>
				</button>
			</div>

			<div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
				<div className="flex gap-4 items-center">
					<div className="flex-1 max-w-xs relative">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
							size={20}
						/>
						<select
							value={selectedProductId}
							onChange={(e) => setSelectedProductId(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium text-slate-700"
						>
							<option value="">Tất cả sản phẩm</option>
							{products.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name} ({p.key})
								</option>
							))}
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600">
							<svg
								className="fill-current h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
							>
								<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
							</svg>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead className="bg-slate-50 border-b border-slate-200">
							<tr>
								<th className="px-6 py-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
									Mã Kích Hoạt
								</th>
								<th className="px-6 py-4 text-sm font-semibold text-slate-600">
									Sản Phẩm
								</th>
								<th className="px-6 py-4 text-sm font-semibold text-slate-600">
									Trạng Thái
								</th>
								<th className="px-6 py-4 text-sm font-semibold text-slate-600">
									Người Kích Hoạt
								</th>
								<th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">
									Thao Tác
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200">
							{loading ? (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-8 text-center text-slate-500"
									>
										<div className="flex justify-center items-center gap-2">
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
											<span>Đang tải...</span>
										</div>
									</td>
								</tr>
							) : instances.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-6 py-12 text-center">
										<QrCode className="mx-auto h-12 w-12 text-slate-300 mb-3" />
										<p className="text-slate-500 font-medium">
											Không tìm thấy mã sản phẩm nào.
										</p>
									</td>
								</tr>
							) : (
								instances.map((item) => (
									<tr key={item._id} className="hover:bg-slate-50">
										<td className="px-6 py-4 text-sm font-mono text-slate-900 font-semibold whitespace-nowrap">
											{item.activation_code}
										</td>
										<td className="px-6 py-4 text-sm text-slate-700 font-medium">
											{item.product_id?.name || "N/A"}
										</td>
										<td className="px-6 py-4">
											<button
												onClick={() =>
													handleToggleStatus(item._id, item.is_activated)
												}
												className={`px-3 py-1.5 text-xs font-semibold rounded-full min-w-[100px] transition ${
													item.is_activated
														? "bg-green-100/80 text-green-700 hover:bg-green-200"
														: "bg-amber-100/80 text-amber-700 hover:bg-amber-200"
												}`}
											>
												{item.is_activated ? "Đã kích hoạt" : "Chưa kích hoạt"}
											</button>
										</td>
										<td className="px-6 py-4 text-sm text-slate-600">
											{item.activated_by ? (
												<div>
													<div className="font-medium text-slate-900">
														{item.activated_by.name}
													</div>
													<div className="text-xs text-slate-500">
														{item.activated_by.email}
													</div>
													{item.activated_at && (
														<div className="text-xs text-slate-400 mt-1">
															{new Date(item.activated_at).toLocaleString(
																"vi-VN",
															)}
														</div>
													)}
												</div>
											) : (
												<span className="text-slate-400 italic">Trống</span>
											)}
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex justify-end gap-2">
												<button
													title="Tải QR"
													onClick={() => handleDownloadQR(item)}
													className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
												>
													<Download size={18} />
												</button>
												<button
													title="Xóa"
													onClick={() => handleDelete(item._id)}
													className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
												>
													<Trash2 size={18} />
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Generate Modal */}
			{showGenerateModal && (
				<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
						<div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
							<h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
								<QrCode className="text-blue-600" size={20} />
								Tạo Mã Sản Phẩm Mới
							</h3>
							<button
								onClick={() => setShowGenerateModal(false)}
								className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-full p-1 transition"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleGenerate} className="p-6 space-y-5">
							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-1.5">
									Sản Phẩm <span className="text-red-500">*</span>
								</label>
								<select
									required
									value={generateForm.product_id}
									onChange={(e) =>
										setGenerateForm({
											...generateForm,
											product_id: e.target.value,
										})
									}
									className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white text-slate-700 transition"
								>
									<option value="" disabled>
										-- Chọn sản phẩm --
									</option>
									{products.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} ({p.key})
										</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-1.5">
										Tiền tố (Prefix) <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										required
										maxLength={10}
										value={generateForm.prefix}
										onChange={(e) =>
											setGenerateForm({
												...generateForm,
												prefix: e.target.value.toUpperCase(),
											})
										}
										className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-mono"
										placeholder="VD: THERA"
									/>
								</div>

								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-1.5">
										Số lượng <span className="text-red-500">*</span>
									</label>
									<input
										type="number"
										min="1"
										max="100"
										required
										value={generateForm.quantity}
										onChange={(e) =>
											setGenerateForm({
												...generateForm,
												quantity: parseInt(e.target.value),
											})
										}
										className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
									/>
								</div>
							</div>

							<div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
								<button
									type="button"
									onClick={() => setShowGenerateModal(false)}
									className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
								>
									Hủy
								</button>
								<button
									type="submit"
									disabled={generating}
									className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
								>
									{generating ? (
										<div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
									) : (
										"Tạo Code"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Hidden container for QR rendering */}
			<div className="absolute opacity-0 pointer-events-none -z-50">
				{downloadData && (
					<QRCodeSVG
						id="qr-code-svg"
						value={downloadData.code}
						size={256}
						level="H"
						includeMargin={true}
					/>
				)}
			</div>
		</div>
	);
}
