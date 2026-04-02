import requests

PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

def get_pubchem_cid(chemical_name: str) -> str | None:
    url = f"{PUBCHEM_BASE}/compound/name/{chemical_name}/cids/JSON"
    res = requests.get(url)
    if res.status_code != 200:
        return None
    data = res.json()
    cids = data.get("IdentifierList", {}).get("CID", [])
    return str(cids[0]) if cids else None

def get_pubchem_properties(cid: str) -> dict:
    props = "MolecularWeight,MolecularFormula,IUPACName,InChIKey,CanonicalSMILES"
    url = f"{PUBCHEM_BASE}/compound/cid/{cid}/property/{props}/JSON"
    res = requests.get(url)
    if res.status_code != 200:
        return {"error": "Failed to retrieve PubChem properties"}
    data = res.json()
    return data.get("PropertyTable", {}).get("Properties", [{}])[0]

def get_combined_chemical_data(name: str) -> dict:
    cid = get_pubchem_cid(name)
    if not cid:
        return {"error": "Chemical not found in PubChem"}

    pubchem_props = get_pubchem_properties(cid)

    return {
        "name": name,
        "cid": cid,
        "pubchem": pubchem_props,
        # "epa": get_epa_data(name)  # Temporarily disabled due to SSL issues
    }
