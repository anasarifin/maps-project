import React, { useState, useRef, useEffect } from "react";

const InputForm = ({ data, show, hide }: Props) => {
	const provinsi = useRef();
	const kota = useRef();
	const kecamatan = useRef();
	const kelurahan = useRef();
	const jalan = useRef();
	const formRef = useRef();

	const onSubmitHandler = (e: Event): void => {
		e.preventDefault();

		console.log({
			provinsi: provinsi.current.value.toUpperCase(),
			kota: kota.current.value.toUpperCase(),
			kecamatan: kecamatan.current.value.toUpperCase(),
			kelurahan: kelurahan.current.value.toUpperCase(),
			jalan: jalan.current.value.toUpperCase(),
		});

		alert("See console...");
		closeHandler();
	};

	const closeHandler = (): void => {
		hide();
		setTimeout(() => {
			formRef.current.style.display = "none";
		}, 300);
	};

	return (
		<form id="map-input-form" className={show ? "show" : ""} onSubmit={onSubmitHandler} ref={formRef}>
			<label>Provinsi :</label>
			<input ref={provinsi} defaultValue={data.provinsi} required />
			<label>Kabupaten/Kota :</label>
			<input ref={kota} defaultValue={data.kabupaten_kota} required />
			<label>Kecamatan :</label>
			<input ref={kecamatan} defaultValue={data.kecamatan} required />
			<label>Desa/Kelurahan :</label>
			<input ref={kelurahan} defaultValue={data.desa_kelurahan} required />
			<label>Jalan :</label>
			<input ref={jalan} defaultValue={data.jalan} />
			<button type="submit">Submit</button>
			<button type="button" onClick={closeHandler}>
				Cancel
			</button>
		</form>
	);
};

interface Data {
	provinsi: string;
	kabupaten_kota: string;
	kecamatan: string;
	desa_kelurahan: string;
	jalan?: string;
}
interface Props {
	data: Data;
	show: boolean;
	hide: () => void;
}

export default InputForm;
