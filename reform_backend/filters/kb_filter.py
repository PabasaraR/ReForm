# filters/kb_filter.py

class KBFilter:
    """Filter knowledge base entries"""
    
    # convert numeric direction value into label
    def direction_side(self, x, eps=1e-4):
        if x > eps:
            return "positive"
        if x < -eps:
            return "negative"
        return "near_zero"

    # Filter KB entries based on detected keypoint directions
    def filter_KB_by_keypoints_and_direction(
        self,
        kb_entries,
        keypoint_summary,
        eps=1e-4,
        require_all_features=True,
        drop_guides=True,
    ):
        # store observed direction sign for each keypoint
        observed_signs = {}
        # calculate direction side for each feature
        for features, info in keypoint_summary.items():
            md = float(info.get("mean_direction", 0.0))
            observed_signs[features] = self.direction_side(md, eps=eps)

        # get all detected keypoints
        summary_features = set(keypoint_summary.keys())

        filtered = []

        # loop through all KB 
        for entry in kb_entries:

            # skip guide type entries if required
            if drop_guides and entry.get("type") == "guide":
                continue
            
            # get pattern information from KB
            pattern = entry.get("pattern", {})
            # get related features from KB entry
            kb_feats = pattern.get("features", [])
            if isinstance(kb_feats, str):
                kb_feats = [kb_feats]
            if not kb_feats:
                continue

            # check if required features exist in detected summary
            if require_all_features:
                if not all(f in summary_features for f in kb_feats):
                    continue
            else:
                if not any(f in summary_features for f in kb_feats):
                    continue
            
            # expected direction signs from KB
            expected_signs = pattern.get("mean_direction_signs", {}) or {}
            # compare expected direction with observed direction
            ok = True
            for f in kb_feats:
                expected = expected_signs.get(f, "common")
                observed = observed_signs.get(f, "near_zero")

                if expected == "common":
                    continue
                if expected != observed:
                    ok = False
                    break

            if ok:
                filtered.append(entry)

        return filtered, observed_signs