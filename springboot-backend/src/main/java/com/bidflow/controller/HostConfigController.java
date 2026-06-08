package com.bidflow.controller;

import com.bidflow.model.HostConfig;
import com.bidflow.repository.HostConfigRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/hosts")
public class HostConfigController {

    private final HostConfigRepository repository;

    public HostConfigController(HostConfigRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<HostConfig> list(@RequestParam(required = false) String createdBy) {
        if (createdBy == null || createdBy.isBlank()) {
            return repository.findAll();
        }
        return repository.findByCreatedBy(createdBy);
    }

    @PostMapping
    public ResponseEntity<HostConfig> create(@RequestBody HostConfig config) {
        HostConfig saved = repository.save(config);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HostConfig> update(@PathVariable String id, @RequestBody HostConfig config) {
        Optional<HostConfig> existing = repository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        config.setId(id);
        HostConfig saved = repository.save(config);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
