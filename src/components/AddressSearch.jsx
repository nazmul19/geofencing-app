import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { searchAddress } from '../utils/geoUtils';
import '../index.css';

function AddressSearch({ onLocationSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        const data = await searchAddress(query);
        setResults(data);
        setIsSearching(false);
        setShowResults(true);
    };

    const handleSelect = (result) => {
        onLocationSelect({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            displayName: result.display_name
        });
        setResults([]);
        setShowResults(false);
        setQuery('');
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search address or place..."
                    className="search-input"
                />
                <button type="submit" className="search-button">
                    {isSearching ? <span className="loader"></span> : <Search size={20} />}
                </button>
            </form>

            {showResults && results.length > 0 && (
                <ul className="search-results">
                    {results.map((item) => (
                        <li key={item.place_id} onClick={() => handleSelect(item)} className="search-item">
                            <MapPin size={16} className="search-item-icon" />
                            <span>{item.display_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AddressSearch;
