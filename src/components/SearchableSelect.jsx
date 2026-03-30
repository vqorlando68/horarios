import React, { useState, useRef, useEffect } from 'react';

// Helper: reads a CSS variable from :root at runtime
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export default function SearchableSelect({ options, selectedId, onChange, placeholder = "Buscar..." }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [, forceRender] = useState(0); // used to re-read CSS vars on open
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpen = () => {
        setOpen(o => !o);
        forceRender(n => n + 1); // refresh CSS vars on open (theme may have changed)
    };

    const matchSearch = (o) => (o.nombre || "").toLowerCase().includes(search.toLowerCase());

    const todosOption = { id: 0, nombre: "Todos" };
    const selectedOption = selectedId === 0 ? todosOption : (options.find(o => o.id === selectedId) || null);

    const withAppts    = options.filter(o => o.tiene_citas).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
    const withoutAppts = options.filter(o => !o.tiene_citas).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

    const isTodosMatch         = matchSearch(todosOption);
    const filteredWithAppts    = withAppts.filter(matchSearch);
    const filteredWithoutAppts = withoutAppts.filter(matchSearch);
    const hasResults           = isTodosMatch || filteredWithAppts.length > 0 || filteredWithoutAppts.length > 0;

    // Read live CSS variables so we stay in sync with the current theme
    const bgInput    = typeof window !== 'undefined' ? cssVar('--input-bg')      : '#fff';
    const bgSurface  = typeof window !== 'undefined' ? cssVar('--bg-surface')    : '#fff';
    const bgAlt      = typeof window !== 'undefined' ? cssVar('--bg-surface-alt'): '#f8fafc';
    const borderCol  = typeof window !== 'undefined' ? cssVar('--border-color')  : '#e5e7eb';
    const textPrim   = typeof window !== 'undefined' ? cssVar('--text-primary')  : '#111827';
    const textMuted  = typeof window !== 'undefined' ? cssVar('--text-muted')    : '#9ca3af';
    const activeItemBg = typeof window !== 'undefined' ? cssVar('--cell-today-bg') : '#eff8ff';
    const hoverBg    = typeof window !== 'undefined' ? cssVar('--sidebar-item-hover') : '#f1f5f9';
    const brandColor = '#00aae1';

    const triggerStyle = {
        padding: "9px 12px",
        border: `1px solid ${borderCol}`,
        borderRadius: "8px",
        background: bgInput,
        color: textPrim,
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.875rem",
        fontFamily: "var(--font-inter, sans-serif)",
        transition: "border-color 0.2s, background-color 0.25s",
        userSelect: "none",
    };

    const dropdownStyle = {
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        right: 0,
        background: bgSurface,
        border: `1px solid ${borderCol}`,
        borderRadius: "10px",
        zIndex: 9999,
        maxHeight: "280px",
        overflowY: "auto",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    };

    const searchWrapStyle = {
        padding: "8px",
        borderBottom: `1px solid ${borderCol}`,
        position: "sticky",
        top: 0,
        background: bgSurface,
    };

    const searchInputStyle = {
        width: "100%",
        padding: "7px 10px",
        border: `1px solid ${borderCol}`,
        borderRadius: "6px",
        boxSizing: "border-box",
        outline: "none",
        fontFamily: "inherit",
        fontSize: "0.85rem",
        background: bgAlt,
        color: textPrim,
        transition: "border-color 0.2s, background-color 0.25s",
    };

    const sectionLabelStyle = {
        padding: "7px 12px",
        fontSize: "0.68rem",
        fontWeight: "700",
        color: textMuted,
        backgroundColor: bgAlt,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    };

    const itemStyle = (isSelected) => ({
        padding: "8px 12px",
        cursor: "pointer",
        background: isSelected ? activeItemBg : "transparent",
        color: textPrim,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.875rem",
        transition: "background-color 0.1s",
    });

    const noResultsStyle = {
        padding: "12px",
        color: textMuted,
        textAlign: "center",
        fontSize: "0.85rem",
    };

    const handleItemHover = (e, isSelected) => {
        e.currentTarget.style.background = hoverBg;
    };
    const handleItemLeave = (e, isSelected) => {
        e.currentTarget.style.background = isSelected ? activeItemBg : "transparent";
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative", minWidth: "250px" }}>
            <div onClick={handleOpen} style={triggerStyle}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedOption ? selectedOption.nombre : placeholder}
                </span>
                <span style={{ fontSize: "0.7em", color: textMuted, marginLeft: "8px", flexShrink: 0 }}>
                    {open ? "▲" : "▼"}
                </span>
            </div>

            {open && (
                <div style={dropdownStyle}>
                    <div style={searchWrapStyle}>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Escribe para buscar..."
                            style={searchInputStyle}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    {isTodosMatch && (
                        <div
                            style={{ ...itemStyle(selectedId === 0), fontWeight: "600" }}
                            onClick={() => { onChange(0); setOpen(false); setSearch(""); }}
                            onMouseEnter={(e) => handleItemHover(e, selectedId === 0)}
                            onMouseLeave={(e) => handleItemLeave(e, selectedId === 0)}
                        >
                            Todos
                        </div>
                    )}

                    {filteredWithAppts.length > 0 && (
                        <div style={sectionLabelStyle}>Profesionales con Atención</div>
                    )}
                    {filteredWithAppts.map(o => (
                        <div
                            key={o.id}
                            style={itemStyle(o.id === selectedId)}
                            onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                            onMouseEnter={(e) => handleItemHover(e, o.id === selectedId)}
                            onMouseLeave={(e) => handleItemLeave(e, o.id === selectedId)}
                        >
                            <span style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                minWidth: "20px", height: "20px", borderRadius: "10px",
                                backgroundColor: brandColor, color: "white",
                                fontSize: "0.68rem", fontWeight: "bold",
                                padding: "0 5px", flexShrink: 0
                            }}>
                                {o.cantidad_citas || 0}
                            </span>
                            {o.nombre}
                        </div>
                    ))}

                    {filteredWithoutAppts.length > 0 && (
                        <div style={sectionLabelStyle}>Profesionales sin Atención</div>
                    )}
                    {filteredWithoutAppts.map(o => (
                        <div
                            key={o.id}
                            style={itemStyle(o.id === selectedId)}
                            onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                            onMouseEnter={(e) => handleItemHover(e, o.id === selectedId)}
                            onMouseLeave={(e) => handleItemLeave(e, o.id === selectedId)}
                        >
                            {o.nombre}
                        </div>
                    ))}

                    {!hasResults && (
                        <div style={noResultsStyle}>No se encontraron resultados</div>
                    )}
                </div>
            )}
        </div>
    );
}
