import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useLoadScript } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = "",
  className = "",
}: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    console.log('[AddressAutocomplete] Initializing Google Places Autocomplete');

    // Initialize Google Places Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components", "formatted_address"],
    });

    // Listen for place selection
    listenerRef.current = autocompleteRef.current.addListener("place_changed", () => {
      console.log('[AddressAutocomplete] place_changed event fired!');
      const place = autocompleteRef.current?.getPlace();

      // Check if a valid place was selected
      if (!place || !place.address_components) {
        console.warn('[AddressAutocomplete] No valid place selected', place);
        return;
      }

      const addressComponents = place.address_components;
      let street = "";
      let city = "";
      let state = "";
      let zipCode = "";

      // Extract address components
      for (const component of addressComponents) {
        const types = component.types;

        if (types.includes("street_number")) {
          street = component.long_name;
        }
        if (types.includes("route")) {
          street += (street ? " " : "") + component.long_name;
        }
        if (types.includes("locality")) {
          city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
        if (types.includes("postal_code")) {
          zipCode = component.long_name;
        }
      }

      // Log the extracted address components
      console.log('[AddressAutocomplete] Address selected:', { street, city, state, zipCode });

      // Update the address field
      onChange(street);

      // Notify parent component of the full address
      if (onAddressSelect) {
        onAddressSelect({ street, city, state, zipCode });
      }
    });

    return () => {
      console.log('[AddressAutocomplete] Cleaning up listeners');
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current);
      }
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded]);

  if (loadError) {
    console.error("Error loading Google Maps:", loadError);
    return <Input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={className} />;
  }

  if (!isLoaded) {
    return <Input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={className} disabled />;
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};
